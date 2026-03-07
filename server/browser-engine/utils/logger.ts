export class Logger {
  static info(message: string, ...args: any[]) {
    console.log(`[BROWSER-ENGINE] [INFO] ${message}`, ...args);
  }

  static error(message: string, ...args: any[]) {
    console.error(`[BROWSER-ENGINE] [ERROR] ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]) {
    console.warn(`[BROWSER-ENGINE] [WARN] ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]) {
    console.debug(`[BROWSER-ENGINE] [DEBUG] ${message}`, ...args);
  }
}
