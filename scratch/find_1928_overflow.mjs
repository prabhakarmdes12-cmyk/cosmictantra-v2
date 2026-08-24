import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  const overflowElements = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (rect.right > 375 || rect.width > 375) {
        if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            parent: el.parentElement ? `${el.parentElement.tagName.toLowerCase()}.${typeof el.parentElement.className === 'string' ? el.parentElement.className.slice(0, 50) : ''}` : ''
          });
        }
      }
    }
    return results;
  });

  console.log(`Found ${overflowElements.length} elements wider than 375px:`);
  overflowElements.slice(0, 15).forEach((item, i) => {
    console.log(`${i + 1}. <${item.tag} class="${item.className}" id="${item.id}"> -> width: ${item.width}px, right: ${item.right}px, parent: <${item.parent}>`);
  });

  await browser.close();
}

run().catch(console.error);
