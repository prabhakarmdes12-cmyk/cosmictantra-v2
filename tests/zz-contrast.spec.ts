import { test } from '@playwright/test';
const PAGES = ['/', '/report', '/darshan', '/aarti-stotra', '/store', '/remedy-tracker', '/calendar', '/upaya', '/observatory', '/ask', '/profile', '/panchang'];
for (const path of PAGES) {
  test(`LIGHT v3 ${path}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cosmictantra_theme', 'light');
      localStorage.setItem('cosmictantra_lang', 'en');
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(400);
    const issues = await page.evaluate(() => {
      const rgbMatch = (s: string) => {
        const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/g) || [];
        return m.map(c => { const p = c.match(/[\d.]+/g)!.map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] !== undefined ? p[3] : 1 }; });
      };
      const lum = (r: number, g: number, b: number) => {
        const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const contrast = (a: number[], b: number[]) => {
        const l1 = lum(a[0], a[1], a[2]), l2 = lum(b[0], b[1], b[2]);
        const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
      };
      const effBg = (el: Element): number[] => {
        let n: Element | null = el;
        while (n) {
          const cs = getComputedStyle(n);
          const img = cs.backgroundImage;
          if (img && img !== 'none') {
            const colors = rgbMatch(img);
            const solid = colors.filter((c: any) => c.a >= 0.85);
            if (solid.length) {
              const avg = solid.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
              const k = solid.length;
              return [avg.r / k, avg.g / k, avg.b / k];
            }
            // only translucent tint stops -> keep walking up
          }
          const bg = rgbMatch(cs.backgroundColor);
          if (bg.length) {
            const c = bg[0];
            if (c.a >= 0.9) return [c.r, c.g, c.b];
          }
          n = n.parentElement;
        }
        return [250, 247, 242];
      };
      const out: any[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set<Element>();
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const text = (n.textContent || '').trim();
        if (!text) continue;
        const el = n.parentElement!;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        if ((el.className || '').toString().includes('sr-only')) continue;
        const fs = parseFloat(cs.fontSize);
        if (!fs || fs < 8) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const col = rgbMatch(cs.color)[0];
        if (!col) continue;
        const bg = effBg(el);
        const ratio = contrast([col.r, col.g, col.b], bg);
        // skip white-on-white that is actually on a dark gradient we can't parse
        if (ratio < 3.0) {
          out.push({ text: text.slice(0, 50), color: cs.color, bg: bg.map(v => Math.round(v)).join(','), ratio: Math.round(ratio * 100) / 100, fs, cls: (el.className || '').toString().slice(0, 50) });
        }
      }
      return out;
    });
    console.log(`LIGHT3 ${path} issues=${issues.length}`);
    for (const i of issues.slice(0, 14)) console.log(`  ${JSON.stringify(i)}`);
  });
}
