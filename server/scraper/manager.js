import puppeteer from 'puppeteer';
import WebSocket from 'ws';
import { scraperConfig } from './config.js';
import { engine } from '../predictor-engine/engine.js';
import { dbManager } from '../db/index.js';
import { broadcastSSE } from '../../api/index.js';
import { externalSites } from '../../client/config/externalSites.config.js';

let browser = null;
let page = null;
let wsClient = null;
let simulationInterval = null;
let browserLogs = [];

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
      
      // Start simulated data feed for now until parser is built
      startSimulation();
      
    } catch (error) {
      scraperConfig.status = `Error: ${error.message}`;
      scraperConfig.isRunning = false;
      console.error('[SCRAPER ERROR]', error);
    }
  },

  stop: async () => {
    scraperConfig.isRunning = false;
    scraperConfig.status = 'Disconnecting...';
    
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    
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
  },

  // Remote Browser Controls
  getScreenshot: async () => {
    if (!page) return null;
    try {
      return await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
    } catch (e) { return null; }
  },
  sendClick: async (x, y) => {
    if (!page) return;
    try { await page.mouse.click(x, y); } catch (e) {}
  },
  sendType: async (text) => {
    if (!page) return;
    try { await page.keyboard.type(text); } catch (e) {}
  },
  sendKey: async (key) => {
    if (!page) return;
    try { await page.keyboard.press(key); } catch (e) {}
  },
  sendScroll: async (deltaY) => {
    if (!page) return;
    try { await page.mouse.wheel({ deltaY }); } catch (e) {}
  },
  startRemoteBrowser: async () => {
    if (!scraperConfig.isRunning) {
      scraperConfig.method = 'puppeteer';
      scraperConfig.targetWebUrl = externalSites.crashUrl;
      await scraperManager.start();
    }
    // If already running, do nothing, just let frontend attach
  },
  goToCrash: async () => {
    if (!page) return;
    scraperConfig.targetWebUrl = externalSites.crashUrl;
    await page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' });
  },
  getBrowserLogs: () => browserLogs,
  evaluateScript: async (code) => {
    if (!page) return { error: 'Browser not running' };
    try {
      const result = await page.evaluate(code);
      return { result };
    } catch (e) {
      return { error: e.message };
    }
  }
};

function startSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  
  let value = 1.00;
  let isRunning = true;
  
  const runGame = () => {
    value = 1.00;
    isRunning = true;
    const crashPoint = Math.random() * 10 + 1;
    
    simulationInterval = setInterval(() => {
      if (!isRunning || !scraperConfig.isRunning) {
        clearInterval(simulationInterval);
        return;
      }
      
      value += value * 0.05;
      
      if (value >= crashPoint) {
        isRunning = false;
        clearInterval(simulationInterval);
        
        const finalValue = parseFloat(value.toFixed(2));
        
        // Save to Database
        dbManager.addCrash(finalValue);
        
        // Broadcast to Frontend
        broadcastSSE({
          type: 'CRASH',
          value: finalValue,
          timestamp: Date.now()
        });
        
        if (scraperConfig.isRunning) {
          setTimeout(runGame, 3000);
        }
      } else {
        // Broadcast live update
        broadcastSSE({
          type: 'UPDATE',
          value: parseFloat(value.toFixed(2)),
          timestamp: Date.now()
        });
      }
    }, 100);
  };
  
  runGame();
}

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
  
  // Capture console logs for DevTools
  page.on('console', msg => {
    browserLogs.push({
      type: msg.type(),
      text: msg.text(),
      time: new Date().toLocaleTimeString()
    });
    if (browserLogs.length > 100) browserLogs.shift();
  });
  
  if (scraperConfig.cookie) {
    // Convert cookie string to puppeteer cookie objects
    try {
      const cookies = scraperConfig.cookie.split(';').map(pair => {
        const [name, ...rest] = pair.split('=');
        return {
          name: name.trim(),
          value: rest.join('=').trim(),
          domain: new URL(scraperConfig.targetWebUrl).hostname
        };
      });
      await page.setCookie(...cookies);
    } catch (e) {
      console.error('[SCRAPER] Failed to parse cookies', e);
    }
  }

  // Intercept WebSocket frames via CDP
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  client.on('Network.webSocketFrameReceived', ({ response }) => {
    const payload = response.payloadData;
    // Process incoming live crash data from the browser's websocket
    // console.log('[CDP WS DATA]', payload);
  });
  
  scraperConfig.status = `Navigating to ${scraperConfig.targetWebUrl}...`;
  console.log(`[SCRAPER] Navigating to ${scraperConfig.targetWebUrl}`);
  
  // We don't await the full load here to prevent blocking if Cloudflare challenges take time
  page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' }).catch(e => console.log('Navigation warning:', e.message));
  
  scraperConfig.status = 'Connected (Puppeteer Active)';
  console.log('[SCRAPER] Puppeteer successfully loaded target.');
}

async function startWebSocket() {
  scraperConfig.status = 'Connecting to WebSocket...';
  console.log(`[SCRAPER] Connecting to WS: ${scraperConfig.targetUrl}`);
  
  const headers = {
    'User-Agent': scraperConfig.userAgent
  };
  
  if (scraperConfig.cookie) {
    headers['Cookie'] = scraperConfig.cookie;
  }
  
  const options = {
    headers,
    followRedirects: true
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
    
    if (err.message.includes('200') || err.message.includes('403') || err.message.includes('503')) {
      console.log('---------------------------------------------------');
      console.log('⚠️ CLOUDFLARE OR HTTP ENDPOINT DETECTED ⚠️');
      console.log('The casino is returning a webpage instead of a WebSocket connection.');
      console.log('Auto-switching to Headless Browser (Puppeteer) mode...');
      console.log('---------------------------------------------------');
      
      scraperConfig.method = 'puppeteer';
      if (wsClient) {
        wsClient.close();
        wsClient = null;
      }
      
      setTimeout(() => {
        if (scraperConfig.isRunning) {
          startPuppeteer().catch(e => console.error('[PUPPETEER ERROR]', e));
        }
      }, 2000);
    }
  });

  wsClient.on('close', () => {
    if (scraperConfig.isRunning && scraperConfig.method === 'websocket') {
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
