export class CDPListener {
  async attach(page, onDataCallback) {
    console.log('[FETCH] Attaching CDP deep packet sniffer...');
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    client.on('Network.webSocketFrameReceived', ({ response }) => {
      onDataCallback(response.payloadData);
    });
  }
}
