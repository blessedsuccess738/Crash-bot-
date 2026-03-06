export const websocketSniffer = {
  name: 'WebSocket Sniffer',
  description: 'Intercepts WebSocket frames for live crash data',
  
  start: async (page) => {
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.webSocketFrameReceived', ({ response }) => {
      const payload = response.payloadData;
      try {
        // Example: Detect crash multiplier in JSON payload
        if (payload.includes('crash') || payload.includes('multiplier')) {
          console.log('[WS Sniffer] Detected potential crash data:', payload.substring(0, 100));
          // Parse logic would go here based on specific site protocol
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    console.log('[WS Sniffer] Listening for WebSocket frames...');
  }
};
