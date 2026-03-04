export class StealthBypass {
  async apply(page) {
    console.log('[BYPASS] Applying WebGL, Canvas, and Audio fingerprint spoofing...');
    
    // Inject stealth scripts before the page even loads
    await page.evaluateOnNewDocument(() => {
      // 1. Overwrite webdriver to false
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // 2. Spoof Chrome runtime to bypass basic checks
      window.chrome = { runtime: {} };
      
      // 3. Spoof plugins to look like a real browser
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3],
      });
    });
  }
}
