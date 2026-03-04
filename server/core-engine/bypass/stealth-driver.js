export class StealthDriver {
  async apply(page) {
    console.log('[BYPASS] Stripping webdriver flags and masking headless browser...');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });
  }
}
