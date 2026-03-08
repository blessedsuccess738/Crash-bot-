import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { browserConfig } from '../config.js';
import { Logger } from '../utils/logger.js';
import { getRandomUserAgent } from './user_agent.js';
import { v4 as uuidv4 } from 'uuid';

// Add stealth plugin
puppeteer.use(StealthPlugin());

export class Renderer {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private activePageId: string | null = null;

  async launch(url: string = browserConfig.targetUrl): Promise<Page | null> {
    try {
      if (!this.browser) {
        Logger.info('Launching browser engine with stealth enabled...');
        this.browser = await (puppeteer as any).launch({
          headless: browserConfig.headless ? true : false,
          args: [
            ...browserConfig.args,
            '--disable-blink-features=AutomationControlled',
            '--no-first-run',
            '--no-service-autorun',
            '--password-store=basic'
          ],
          defaultViewport: browserConfig.viewport,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });
      }

      return await this.createTab(url);
    } catch (error) {
      Logger.error('Failed to launch browser:', error);
      await this.close();
      return null;
    }
  }

  async createTab(url: string): Promise<Page | null> {
    if (!this.browser) return null;
    
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent(getRandomUserAgent());
      
      // Extra stealth measures
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      const id = uuidv4();
      this.pages.set(id, page);
      this.activePageId = id;
      
      Logger.info(`Created tab ${id}, navigating to ${url}...`);
      
      // Await navigation with a timeout but don't fail if it's just slow
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: browserConfig.defaultTimeout 
        });
        Logger.info(`Navigation to ${url} completed.`);
      } catch (e: any) {
        Logger.warn(`Navigation to ${url} warning: ${e.message}. Continuing anyway...`);
      }
      
      return page;
    } catch (error) {
      Logger.error('Failed to create tab:', error);
      return null;
    }
  }

  async switchTab(id: string): Promise<boolean> {
    if (this.pages.has(id)) {
      this.activePageId = id;
      const page = this.pages.get(id);
      if (page) {
        await page.bringToFront();
        return true;
      }
    }
    return false;
  }

  async closeTab(id: string): Promise<boolean> {
    const page = this.pages.get(id);
    if (page) {
      await page.close();
      this.pages.delete(id);
      if (this.activePageId === id) {
        this.activePageId = this.pages.keys().next().value || null;
      }
      return true;
    }
    return false;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages.clear();
      this.activePageId = null;
      Logger.info('Browser engine closed.');
    }
  }

  getPage(): Page | null {
    if (this.activePageId && this.pages.has(this.activePageId)) {
      return this.pages.get(this.activePageId) || null;
    }
    return null;
  }

  getTabs(): { id: string, title: string, url: string, active: boolean }[] {
    const tabs: any[] = [];
    this.pages.forEach((page, id) => {
      // Note: page.title() is async, so we might need to cache it or just return url for now
      // For sync return, we'll use url. We can't await here.
      tabs.push({
        id,
        url: page.url(),
        active: id === this.activePageId
      });
    });
    return tabs;
  }

  async screenshot(): Promise<string | null> {
    const page = this.getPage();
    if (!page) return null;
    try {
      return await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }) as string;
    } catch (e) {
      return null;
    }
  }
}
