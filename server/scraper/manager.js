import { browserEngine } from '../browser-engine/main.js';
import { Inspector } from '../browser-engine/devtools/inspector.js';

// ... existing imports ...

let browser = null;
let page = null;
let wsClient = null;
let simulationInterval = null;
let browserLogs = [];
let networkLogs = []; // New network logs
const masterController = new MasterController();

// ... parsers definition ...

export const scraperManager = {
  // ... existing methods ...
  getConfig: () => scraperConfig,
  
  updateConfig: (newConfig) => {
    Object.assign(scraperConfig, newConfig);
    return scraperConfig;
  },

  // ... start/stop methods ...
  start: async (force = false) => {
    if (scraperConfig.isRunning && !force) {
      console.log('[SCRAPER] Already running. Use force=true to restart.');
      return;
    }
    
    if (force && scraperConfig.isRunning) {
      await scraperManager.stop();
    }

    scraperConfig.isRunning = true;
    scraperConfig.status = 'Initializing...';

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
    
    await browserEngine.stop();
    page = null;
    
    scraperConfig.status = 'Disconnected';
    console.log('[SCRAPER] Stopped.');
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
      // Only set default if not already set by user
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

// ... startSimulation ...

// ... runScraperLoop ...

async function startPuppeteer() {
  scraperConfig.status = 'Launching Headless Browser...';
  console.log('[SCRAPER] Launching Browser Engine...');
  
  await browserEngine.start(scraperConfig.targetWebUrl);
  page = browserEngine.getPage();
  
  if (!page) {
    throw new Error('Failed to start browser engine');
  }
  
  // Capture console logs for DevTools
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

  // Capture page errors
  page.on('pageerror', err => {
    browserLogs.push({
      type: 'error',
      text: `[Page Error] ${err.message}`,
      time: new Date().toLocaleTimeString()
    });
  });

  // Capture failed requests
  page.on('requestfailed', req => {
    browserLogs.push({
      type: 'warning',
      text: `[Network Fail] ${req.url()} - ${req.failure().errorText}`,
      time: new Date().toLocaleTimeString()
    });
  });

  // Capture all network requests for Inspector
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
  
  // Initialize the Deep Hardcore Engine
  await masterController.initialize(page, scraperConfig);
  
  // ... rest of startPuppeteer ...
  
  // Select Parser
  let activeParser = null;
  // ... (rest of parser logic remains same) ...

  for (const [domain, parser] of Object.entries(parsers)) {
    if (scraperConfig.targetWebUrl.includes(domain)) {
      activeParser = parser;
      break;
    }
  }

  if (activeParser) {
    console.log(`[SCRAPER] Activated Parser: ${activeParser.name}`);
    // Stop simulation if we have a real parser
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    // Start the real scraper loop
    runScraperLoop(activeParser);
  } else {
    console.log('[SCRAPER] No specific parser found. Using generic fallback.');
    // Fallback to simulation if no parser found
    if (!simulationInterval) startSimulation();
  }

  // Inject Cookies if available
  if (scraperConfig.cookie) {
    await cookieInjector.inject(page, scraperConfig.cookie);
  }

  // Start WebSocket Sniffer
  await websocketSniffer.start(page);
  
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
  scraperManager.startRemoteBrowser();
}, 5000);
