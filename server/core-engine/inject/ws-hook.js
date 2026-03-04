export class WSHook {
  async inject(page) {
    console.log('[INJECT] Overriding native window.WebSocket...');
    await page.evaluateOnNewDocument(() => {
      const OrigWebSocket = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        const ws = new OrigWebSocket(url, protocols);
        ws.addEventListener('message', (msg) => {
          window.__interceptedWSData = msg.data;
          document.dispatchEvent(new CustomEvent('ws_message', { detail: msg.data }));
        });
        return ws;
      };
      window.WebSocket.prototype = OrigWebSocket.prototype;
    });
  }
}
