import puppeteer from 'puppeteer';
import WebSocket from 'ws';
import { scraperConfig } from './config.js';
import { engine } from '../predictor-engine/engine.js';
import { dbManager } from '../db/index.js';
import { broadcastSSE } from '../../api/index.js';
import { externalSites } from '../../client/config/externalSites.config.js';
import { MasterController } from '../core-engine/MasterController.js';

// Import Parsers
import { bcgameParser } from './parsers/bcgame.js';
import { stakeParser } from './parsers/stake.js';
import { aviatorParser } from './parsers/aviator.js';
import { websocketSniffer } from './parsers/websocket-sniffer.js';
import { roobetParser } from './parsers/roobet.js';
import { duelbitsParser } from './parsers/duelbits.js';
import { win1Parser } from './parsers/1win.js';
import { pinUpParser } from './parsers/pin-up.js';
import { spribeParser } from './parsers/spribe.js';
import { betFuryParser } from './parsers/betfury.js';
import { trustDiceParser } from './parsers/trustdice.js';
import { nanogamesParser } from './parsers/nanogames.js';
import { bitslerParser } from './parsers/bitsler.js';
import { earnBetParser } from './parsers/earnbet.js';
import { rollbitParser } from './parsers/rollbit.js';
import { gamdomParser } from './parsers/gamdom.js';
import { csgoEmpireParser } from './parsers/csgoempire.js';
import { datDropParser } from './parsers/datdrop.js';
import { keyDropParser } from './parsers/keydrop.js';
import { hellcaseParser } from './parsers/hellcase.js';
import { farmskinsParser } from './parsers/farmskins.js';
import { csgorollParser } from './parsers/csgoroll.js';

// Import Strategies
import { patternRecognition } from '../predictor-engine/strategies/pattern-recognition.js';
import { rtpCalculator } from '../predictor-engine/strategies/rtp-calculator.js';
import { hashCracker } from '../predictor-engine/strategies/hash-cracker.js';

// Import Tools
import { cookieInjector } from '../tools/cookie-injector.js';
import { proxyRotator } from '../tools/proxy-rotator.js';
import { autoBetter } from '../tools/auto-better.js';

let browser = null;
let page = null;
let wsClient = null;
let simulationInterval = null;
let browserLogs = [];
const masterController = new MasterController();

const parsers = {
  'bc.game': bcgameParser,
  'stake.com': stakeParser,
  'aviator': aviatorParser,
  'roobet.com': roobetParser,
  'duelbits.com': duelbitsParser,
  '1win.pro': win1Parser,
  'pin-up.casino': pinUpParser,
  'spribe.co': spribeParser,
  'betfury.io': betFuryParser,
  'trustdice.win': trustDiceParser,
  'nanogames.io': nanogamesParser,
  'bitsler.com': bitslerParser,
  'earnbet.io': earnBetParser,
  'rollbit.com': rollbitParser,
  'gamdom.com': gamdomParser,
  'csgoempire.com': csgoEmpireParser,
  'datdrop.com': datDropParser,
  'key-drop.com': keyDropParser,
  'hellcase.com': hellcaseParser,
  'farmskins.com': farmskinsParser,
  'csgoroll.com': csgorollParser
};

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
      // Only set default if not already set by user
      if (!scraperConfig.targetWebUrl) {
        scraperConfig.targetWebUrl = externalSites.crashUrl;
      }
      await scraperManager.start();
    } else if (scraperConfig.method === 'puppeteer' && page) {
      // If already running, ensure we are at the right URL
      if (page.url() !== scraperConfig.targetWebUrl) {
        await page.goto(scraperConfig.targetWebUrl, { waitUntil: 'domcontentloaded' }).catch(e => console.log('Navigation warning:', e.message));
      }
    }
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
  let history = []; // Keep track of history for strategies
  
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
        history.push(finalValue);
        if (history.length > 50) history.shift();
        
        // Save to Database
        dbManager.addCrash(finalValue);
        
        // Analyze with Strategies
        const pattern = patternRecognition.analyze(history);
        const rtp = rtpCalculator.calculate(history);
        
        // Broadcast to Frontend
        broadcastSSE({
          type: 'CRASH',
          value: finalValue,
          timestamp: Date.now(),
          analysis: {
            pattern,
            rtp
          }
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
  
  // Initialize the Deep Hardcore Engine
  await masterController.initialize(page, scraperConfig);
  
  // Select Parser
  let activeParser = null;
  for (const [domain, parser] of Object.entries(parsers)) {
    if (scraperConfig.targetWebUrl.includes(domain)) {
      activeParser = parser;
      break;
    }
  }

  if (activeParser) {
    console.log(`[SCRAPER] Activated Parser: ${activeParser.name}`);
    // In a real implementation, we would attach the parser to the page loop
    // For now, we just log it
  } else {
    console.log('[SCRAPER] No specific parser found. Using generic fallback.');
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
  scraperManager.start();
}, 2000);
