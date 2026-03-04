export class WSHooker {
  async inject(page) {
    console.log('[INJECTOR] Injecting native WebSocket hooks into page context...');
    
    // This script is injected directly into the browser's memory
    await page.evaluateOnNewDocument(() => {
      const OrigWebSocket = window.WebSocket;
      
      // Override the native WebSocket object
      window.WebSocket = function(url, protocols) {
        const ws = new OrigWebSocket(url, protocols);
        
        // Intercept messages at the DOM level before the site's React app sees them
        ws.addEventListener('message', (msg) => {
          window.__interceptedWSData = msg.data;
          // We can also emit a custom event here that Puppeteer listens for
          document.dispatchEvent(new CustomEvent('ws_message', { detail: msg.data }));
        });
        
        return ws;
      };
      
      // Preserve the prototype chain so anti-cheat doesn't detect the override
      window.WebSocket.prototype = OrigWebSocket.prototype;
    });
  }
}
