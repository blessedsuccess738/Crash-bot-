export const browserConfig = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-extensions',
    '--disable-infobars',
    '--window-size=1920,1080'
  ],
  viewport: { width: 1920, height: 1080 },
  defaultTimeout: 30000,
  targetUrl: 'https://bc.game/game/crash'
};
