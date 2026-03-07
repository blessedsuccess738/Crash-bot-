import { Page } from 'puppeteer';

export class Inspector {
  static async inspectElement(page: Page, x: number, y: number) {
    if (!page) return null;
    try {
      return await page.evaluate((x, y) => {
        const el = document.elementFromPoint(x, y) as HTMLElement;
        if (!el) return null;
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          innerText: el.innerText?.substring(0, 50) + (el.innerText?.length > 50 ? '...' : ''),
          attributes: Array.from(el.attributes).reduce((acc: any, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          rect: el.getBoundingClientRect().toJSON()
        };
      }, x, y);
    } catch (e) { return null; }
  }
}
