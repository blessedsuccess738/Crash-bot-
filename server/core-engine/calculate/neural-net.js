export class NeuralNet {
  constructor() {
    this.history = [];
  }

  async process(data) {
    let trend = 'unknown';

    if (data && data.length > 0 && data[0] === 'crash_update') {
      const crashPoint = data[1].crashPoint;
      this.history.push(crashPoint);
      
      if (this.history.length >= 3) {
        const last3 = this.history.slice(-3);
        if (last3.every(val => val < 2.00)) {
          trend = 'up';
        } else {
          trend = 'down';
        }
      }
    }

    return { trend, historyLength: this.history.length };
  }
}
