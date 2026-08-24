import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024, 1440];
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runInspection() {
  console.log('Starting programmatic viewport overflow inspection using local Chromium engine...');
  const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
  const results = {};

  for (const width of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Inspecting Viewport Width: ${width}px`);
    console.log(`========================================`);
    
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Scroll down to load lazy components / full page
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50);
      });
    });

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowInnerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Document scrollWidth: ${docScrollWidth}px | window.innerWidth: ${windowInnerWidth}px | Overflow: ${docScrollWidth > windowInnerWidth + 1 ? 'YES (' + (docScrollWidth - windowInnerWidth) + 'px)' : 'NO'}`);

    const overflowingElements = await page.evaluate((vw) => {
      const getSelector = (el) => {
        if (el.id) return `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
          if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
        }
        return el.tagName.toLowerCase();
      };

      const allNodes = Array.from(document.querySelectorAll('*'));
      const problematic = [];

      for (const node of allNodes) {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        
        // Ignore hidden or unrendered elements
        if (rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden') continue;

        const isExceedingRight = rect.right > vw + 1.5;
        const isExceedingLeft = rect.left < -1.5;

        if (isExceedingRight || isExceedingLeft) {
          problematic.push({
            tagName: node.tagName,
            selector: getSelector(node),
            className: node.className || '',
            id: node.id || '',
            rect: {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            parentSelector: node.parentElement ? getSelector(node.parentElement) : 'root',
            styles: {
              width: style.width,
              minWidth: style.minWidth,
              maxWidth: style.maxWidth,
              flex: style.flex,
              flexShrink: style.flexShrink,
              position: style.position,
              transform: style.transform,
              margin: style.margin,
              padding: style.padding,
              whiteSpace: style.whiteSpace,
              overflow: style.overflow,
              overflowX: style.overflowX
            },
            reason: isExceedingRight ? `Extends ${Math.round(rect.right - vw)}px past right viewport edge` : `Extends ${Math.round(-rect.left)}px past left viewport edge`
          });
        }
      }
      return problematic;
    }, width);

    results[width] = {
      docScrollWidth,
      windowInnerWidth,
      hasPageOverflow: docScrollWidth > width + 1,
      overflowAmount: Math.max(0, docScrollWidth - width),
      overflowingElements
    };

    console.log(`Found ${overflowingElements.length} overflowing elements at ${width}px:`);
    overflowingElements.slice(0, 10).forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.selector}] (${item.reason}) -> width:${item.rect.width}px, right:${item.rect.right}px, parent:${item.parentSelector}`);
      console.log(`     CSS: width=${item.styles.width}, minWidth=${item.styles.minWidth}, position=${item.styles.position}, whiteSpace=${item.styles.whiteSpace}`);
    });
    if (overflowingElements.length > 10) {
      console.log(`  ... and ${overflowingElements.length - 10} more`);
    }

    await page.close();
  }

  await browser.close();

  const reportPath = path.join(process.cwd(), 'scratch', 'overflow_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed inspection report written to: ${reportPath}`);
}

runInspection().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
