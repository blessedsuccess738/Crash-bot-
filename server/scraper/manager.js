import puppeteer from 'puppeteer';
import WebSocket from 'ws';
import { scraperConfig } from './config.js';
import { engine } from '../predictor-engine/engine.js';

let browser = null;
let page = null;
let wsClient = null;

export const scraperManager = {
  getConfig: () => scraperConfig,
  
  updateConfig: (newConfig) => {
    Object.assign(scraperConfig, newConfig);
    return scraperConfig;
  },

  start: async () => {
    if (scraperConfig.isRunning) return;
    scraperConfig.isRunning = true;
    scraperConfig.status = 'Connecting...';

    try {
      if (scraperConfig.method === 'puppeteer') {
        await startPuppeteer();
      } else {
        await startWebSocket();
      }
    } catch (error) {
      scraperConfig.status = `Error: ${error.message}`;
      scraperConfig.isRunning = false;
      console.error('[SCRAPER ERROR]', error);
    }
  },

  stop: async () => {
    scraperConfig.isRunning = false;
    scraperConfig.status = 'Disconnecting...';
    
    if (wsClient) {
      wsClient.close();
      wsClient = null;
    }
    
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
    }
    
    scraperConfig.status = 'Disconnected';
    console.log('[SCRAPER] Stopped.');
  }
};

async function startPuppeteer() {
  scraperConfig.status = 'Launching Headless Browser...';
  console.log('[SCRAPER] Launching Puppeteer...');
  
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
  if (scraperConfig.proxy) {
    args.push(`--proxy-server=${scraperConfig.proxy}`);
  }

  browser = await puppeteer.launch({ 
    headless: "new", 
    args 
  });
  
  page = await browser.newPage();
  await page.setUserAgent(scraperConfig.userAgent);
  
  scraperConfig.status = `Navigating to ${scraperConfig.targetWebUrl}...`;
  console.log(`[SCRAPER] Navigating to ${scraperConfig.targetWebUrl}`);
  
  // We don't await the full load here to prevent blocking if Cloudflare challenges take time
  page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' }).catch(e => console.log('Navigation warning:', e.message));
  
  scraperConfig.status = 'Connected (Puppeteer Active)';
  console.log('[SCRAPER] Puppeteer successfully loaded target.');
  
  // In a real scenario, we would inject scripts here to read the canvas
  // or intercept WebSocket frames via Chrome DevTools Protocol (CDP).
}

async function startWebSocket() {
  scraperConfig.status = 'Connecting to WebSocket...';
  console.log(`[SCRAPER] Connecting to WS: ${scraperConfig.targetUrl}`);
  
  const options = {
    headers: {
      'User-Agent': scraperConfig.userAgent
    }
  };

  wsClient = new WebSocket(scraperConfig.targetUrl, options);

  wsClient.on('open', () => {
    scraperConfig.status = 'Connected (WebSocket Active)';
    console.log('[SCRAPER] WebSocket connected.');
  });

  wsClient.on('message', (data) => {
    // Process incoming live crash data
    // console.log('[SCRAPER WS DATA]', data.toString());
  });

  wsClient.on('error', (err) => {
    scraperConfig.status = `WS Error: ${err.message}`;
    console.error('[SCRAPER] WS Error:', err.message);
  });

  wsClient.on('close', () => {
    if (scraperConfig.isRunning) {
      scraperConfig.status = 'Disconnected (Reconnecting...)';
      console.log('[SCRAPER] WS Closed. Reconnecting in 5s...');
      setTimeout(startWebSocket, 5000);
    }
  });
}

// AUTO-START BACKGROUND SERVICE
setTimeout(() => {
  console.log('[SYSTEM] Auto-starting background scraper...');
  scraperManager.start();
}, 2000);
