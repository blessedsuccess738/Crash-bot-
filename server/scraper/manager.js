import { browserEngine } from '../browser-engine/main.js';
import { Inspector } from '../browser-engine/devtools/inspector.js';
import { scraperConfig } from './config.js';
import { externalSites } from '../../client/config/externalSites.config.js';
import { MasterController } from '../core-engine/MasterController.js';
import { bcgameParser } from './parsers/bcgame.js';
import { websocketSniffer } from './parsers/websocket-sniffer.js';
import WebSocket from 'ws';

let wsClient = null;
let simulationInterval = null;
let browserLogs = [];
let networkLogs = [];
let systemLogs = [];
const masterController = new MasterController();

function logSystem(text) {
  systemLogs.push({ text, time: new Date().toLocaleTimeString() });
  if (systemLogs.length > 100) systemLogs.shift();
  console.log(`[SYSTEM LOG] ${text}`);
}

const parsers = {
  'bc.game': bcgameParser
};

export const scraperManager = {
  getConfig: () => scraperConfig,
  
  updateConfig: (newConfig) => {
    Object.assign(scraperConfig, newConfig);
    return scraperConfig;
  },

  start: async (force = false) => {
    logSystem(`Starting scraper (force=${force})...`);
    if (scraperConfig.isRunning && !force) {
      logSystem('Already running. Use force=true to restart.');
      return;
    }
    
    if (force && scraperConfig.isRunning) {
      logSystem('Stopping existing instance for force restart...');
      await scraperManager.stop();
    }

    scraperConfig.isRunning = true;
    scraperConfig.status = 'Initializing...';

    try {
      if (scraperConfig.method === 'puppeteer') {
        await startPuppeteer(force);
      } else {
        await startWebSocket();
      }
      
      // Start simulated data feed for now until parser is built
      startSimulation();
      
    } catch (error) {
      logSystem(`Start error: ${error.message}`);
      scraperConfig.status = `Error: ${error.message}`;
      scraperConfig.isRunning = false;
      console.error('[SCRAPER ERROR]', error);
    }
  },

  stop: async () => {
    logSystem('Stopping scraper...');
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
    
    await browserEngine.stop();
    
    scraperConfig.status = 'Disconnected';
    logSystem('Scraper stopped.');
  },

  // Remote Browser Controls
  getScreenshot: async () => {
    return await browserEngine.getScreenshot();
  },
  sendClick: async (x, y) => {
    const page = browserEngine.getPage();
    if (!page) return;
    try { await page.mouse.click(x, y); } catch (e) {}
  },
  sendType: async (text) => {
    const page = browserEngine.getPage();
    if (!page) return;
    try { await page.keyboard.type(text); } catch (e) {}
  },
  sendKey: async (key) => {
    const page = browserEngine.getPage();
    if (!page) return;
    try { await page.keyboard.press(key); } catch (e) {}
  },
  sendScroll: async (deltaY) => {
    const page = browserEngine.getPage();
    if (!page) return;
    try { await page.mouse.wheel({ deltaY }); } catch (e) {}
  },
  inspectElement: async (x, y) => {
    const page = browserEngine.getPage();
    if (!page) return null;
    return await Inspector.inspectElement(page, x, y);
  },
  startRemoteBrowser: async (force = false) => {
    if (force) {
      await scraperManager.stop();
    }

    if (!scraperConfig.isRunning) {
      scraperConfig.method = 'puppeteer';
      if (!scraperConfig.targetWebUrl) {
        scraperConfig.targetWebUrl = externalSites.crashUrl;
      }
      await scraperManager.start(true);
    } else if (scraperConfig.method === 'puppeteer') {
      const page = browserEngine.getPage();
      if (page && page.url() !== scraperConfig.targetWebUrl) {
        await page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' }).catch(e => console.log('Navigation warning:', e.message));
      }
    }
  },
  goToCrash: async () => {
    const page = browserEngine.getPage();
    if (!page) return;
    scraperConfig.targetWebUrl = externalSites.crashUrl;
    await page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' });
  },
  getTabs: () => browserEngine.getTabs(),
  createTab: async (url) => {
    await browserEngine.createTab(url);
  },
  switchTab: async (id) => {
    await browserEngine.switchTab(id);
  },
  closeTab: async (id) => {
    await browserEngine.closeTab(id);
  },
  goBack: async () => {
    const page = browserEngine.getPage();
    if (page) await page.goBack();
  },
  goForward: async () => {
    const page = browserEngine.getPage();
    if (page) await page.goForward();
  },
  reload: async () => {
    const page = browserEngine.getPage();
    if (page) await page.reload();
  },
  getBrowserLogs: () => browserLogs,
  getNetworkLogs: () => networkLogs,
  getSystemLogs: () => systemLogs,
  evaluateScript: async (code) => {
    const page = browserEngine.getPage();
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
  simulationInterval = setInterval(() => {
    // Simulated data for UI testing
  }, 1000);
}

async function runScraperLoop(parser) {
  while (scraperConfig.isRunning) {
    const page = browserEngine.getPage();
    if (page) {
      const multiplier = await parser.parseMultiplier(page);
      if (multiplier) {
        // Handle multiplier
      }
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

async function startPuppeteer(force = false) {
  logSystem(`Launching Puppeteer (force=${force})...`);
  scraperConfig.status = 'Launching Headless Browser...';
  console.log('[SCRAPER] Launching Browser Engine...');
  
  await browserEngine.start(scraperConfig.targetWebUrl, force);
  const page = browserEngine.getPage();
  
  if (!page) {
    logSystem('Failed to start browser engine.');
    throw new Error('Failed to start browser engine');
  }
  
  logSystem('Browser engine started. Setting up listeners...');
  
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '')));
    const text = args.length ? args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') : msg.text();
    
    browserLogs.push({
      type: msg.type(),
      text: text,
      time: new Date().toLocaleTimeString()
    });
    if (browserLogs.length > 200) browserLogs.shift();
  });

  page.on('pageerror', err => {
    browserLogs.push({
      type: 'error',
      text: `[Page Error] ${err.message}`,
      time: new Date().toLocaleTimeString()
    });
  });

  page.on('requestfailed', req => {
    browserLogs.push({
      type: 'warning',
      text: `[Network Fail] ${req.url()} - ${req.failure()?.errorText || 'Unknown error'}`,
      time: new Date().toLocaleTimeString()
    });
  });

  page.on('requestfinished', req => {
    networkLogs.push({
      method: req.method(),
      url: req.url(),
      status: req.response()?.status() || '???',
      type: req.resourceType(),
      time: new Date().toLocaleTimeString()
    });
    if (networkLogs.length > 100) networkLogs.shift();
  });
  
  await masterController.initialize(page, scraperConfig);
  
  let activeParser = null;
  for (const [domain, parser] of Object.entries(parsers)) {
    if (scraperConfig.targetWebUrl.includes(domain)) {
      activeParser = parser;
      break;
    }
  }

  if (activeParser) {
    console.log(`[SCRAPER] Activated Parser: ${activeParser.name}`);
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    runScraperLoop(activeParser);
  } else {
    console.log('[SCRAPER] No specific parser found. Using generic fallback.');
    if (!simulationInterval) startSimulation();
  }

  await websocketSniffer.start(page);
  
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.includes('bc.game')) {
    scraperConfig.status = `Navigating to ${scraperConfig.targetWebUrl}...`;
    console.log(`[SCRAPER] Navigating to ${scraperConfig.targetWebUrl}`);
    
    try {
      await page.goto(scraperConfig.targetWebUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      scraperConfig.status = 'Connected (Puppeteer Active)';
      console.log('[SCRAPER] Puppeteer successfully loaded target.');
    } catch (e) {
      console.log('Navigation warning:', e.message);
      scraperConfig.status = 'Connected (Limited Visibility)';
    }
  } else {
    scraperConfig.status = 'Connected (Puppeteer Active)';
    console.log('[SCRAPER] Puppeteer already at target.');
  }
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
  });

  wsClient.on('error', (err) => {
    scraperConfig.status = `WS Error: ${err.message}`;
    console.error('[SCRAPER] WS Error:', err.message);
    
    if (err.message.includes('200') || err.message.includes('403') || err.message.includes('503')) {
      console.log('Auto-switching to Headless Browser (Puppeteer) mode...');
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
  scraperManager.startRemoteBrowser();
}, 5000);

