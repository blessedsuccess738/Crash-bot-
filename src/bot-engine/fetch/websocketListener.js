
// Simulates a WebSocket listener for the casino feed
export class WebSocketListener {
  constructor(url) {
    this.url = url;
    this.listeners = [];
    this.interval = null;
  }

  connect() {
    console.log(`[WS] Connecting to ${this.url}...`);
    // Simulate connection
    this.interval = setInterval(() => {
      const mockData = {
        type: 'multiplier_update',
        value: (Math.random() * 10).toFixed(2),
        timestamp: Date.now()
      };
      this.notify(mockData);
    }, 1000);
  }

  disconnect() {
    if (this.interval) clearInterval(this.interval);
    console.log('[WS] Disconnected');
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(data) {
    this.listeners.forEach(cb => cb(data));
  }
}
