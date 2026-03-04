export const scraperConfig = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  proxy: '',
  cookie: '',
  method: 'puppeteer', // Default to puppeteer to avoid Cloudflare WS blocks
  targetUrl: 'wss://crash.bc.game/ws', // Example WS
  targetWebUrl: 'https://bc.game/crash',
  isRunning: false,
  status: 'Disconnected'
};
