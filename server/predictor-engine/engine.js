
// Main predictor engine
import { analyzeHistory } from './analyzer.js';
import { calculateProbability } from './probabilityModel.js';

export class PredictionEngine {
  constructor() {
    this.isRunning = false;
    this.history = [];
    this.stats = {
      totalPredictions: 0,
      lastPredictionTime: 0,
      averageLatency: 0,
      uptime: 0,
      startTime: null
    };
  }

  start() {
    this.isRunning = true;
    this.stats.startTime = Date.now();
    console.log('[ENGINE] Started prediction engine');
  }

  stop() {
    this.isRunning = false;
    this.stats.uptime += Date.now() - this.stats.startTime;
    this.stats.startTime = null;
    console.log('[ENGINE] Stopped prediction engine');
  }

  predictNext(history) {
    if (!this.isRunning) return null;
    
    const startTime = performance.now();
    
    const analysis = analyzeHistory(history);
    const probability = calculateProbability(analysis);
    
    // Combine analysis with probability model
    // This is a simplified logic for the demo
    const basePrediction = Math.random() * 2 + 1; // Random between 1x and 3x
    const volatilityAdjustment = analysis.volatility > 0.5 ? 0.5 : 0;
    
    const result = (basePrediction + volatilityAdjustment).toFixed(2);
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    this.stats.totalPredictions++;
    this.stats.lastPredictionTime = Date.now();
    this.stats.averageLatency = ((this.stats.averageLatency * (this.stats.totalPredictions - 1)) + latency) / this.stats.totalPredictions;
    
    return result;
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: {
        ...this.stats,
        currentUptime: this.isRunning ? Date.now() - this.stats.startTime : 0
      }
    };
  }
}

export const engine = new PredictionEngine();
