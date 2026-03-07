import puppeteer, { Browser, Page } from 'puppeteer';
import { browserConfig } from '../config.js';
import { Logger } from '../utils/logger.js';
import { getRandomUserAgent } from './user_agent.js';

export class Renderer {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(url: string = browserConfig.targetUrl): Promise<Page | null> {
    try {
      Logger.info('Launching browser engine...');
      this.browser = await puppeteer.launch({
        headless: browserConfig.headless ? 'new' : false,
        args: browserConfig.args,
        defaultViewport: browserConfig.viewport
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(getRandomUserAgent());
      
      Logger.info(`Navigating to ${url}...`);
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: browserConfig.defaultTimeout });
      
      return this.page;
    } catch (error) {
      Logger.error('Failed to launch browser:', error);
      await this.close();
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      Logger.info('Browser engine closed.');
    }
  }

  getPage(): Page | null {
    return this.page;
  }

  async screenshot(): Promise<string | null> {
    if (!this.page) return null;
    try {
      return await this.page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 }) as string;
    } catch (e) {
      return null;
    }
  }
}
