export class CDPInterceptor {
  async attach(page, onDataCallback) {
    console.log('[FETCHER] Attaching deep CDP WebSocket sniffer...');
    
    // Connect directly to Chrome DevTools Protocol
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    // Intercept raw WebSocket frames bypassing the DOM entirely
    client.on('Network.webSocketFrameReceived', ({ response }) => {
      onDataCallback(response.payloadData);
    });
  }

  read(payload) {
    // Deep packet inspection logic to decode BC.Game's specific socket format
    // (e.g., stripping socket.io prefixes like "42", parsing JSON)
    try {
      if (typeof payload === 'string' && payload.startsWith('42')) {
        return JSON.parse(payload.substring(2));
      }
      return payload;
    } catch (e) {
      return null;
    }
  }
}
