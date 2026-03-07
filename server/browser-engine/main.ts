import { Renderer } from './engine/renderer.js';
import { Logger } from './utils/logger.js';
import { browserConfig } from './config.js';

export class BrowserEngine {
  private renderer: Renderer;
  private isRunning: boolean = false;

  constructor() {
    this.renderer = new Renderer();
  }

  async start(url: string = browserConfig.targetUrl) {
    if (this.isRunning) {
      Logger.warn('Browser engine already running. Restarting...');
      await this.stop();
    }

    try {
      Logger.info('Initializing browser engine...');
      const page = await this.renderer.launch(url);
      if (page) {
        this.isRunning = true;
        Logger.info('Browser engine started successfully.');
      } else {
        Logger.error('Failed to start browser engine.');
      }
    } catch (error) {
      Logger.error('Error starting browser engine:', error);
    }
  }

  async stop() {
    if (this.isRunning) {
      Logger.info('Stopping browser engine...');
      await this.renderer.close();
      this.isRunning = false;
      Logger.info('Browser engine stopped.');
    }
  }

  async createTab(url: string) {
    return await this.renderer.createTab(url);
  }

  async switchTab(id: string) {
    return await this.renderer.switchTab(id);
  }

  async closeTab(id: string) {
    return await this.renderer.closeTab(id);
  }

  getTabs() {
    return this.renderer.getTabs();
  }

  getPage() {
    return this.renderer.getPage();
  }

  async getScreenshot(): Promise<string | null> {
    return await this.renderer.screenshot();
  }

  isRunningStatus(): boolean {
    return this.isRunning;
  }
}

export const browserEngine = new BrowserEngine();
