
// Main predictor engine
import { analyzeHistory } from './analyzer';
import { calculateProbability } from './probabilityModel';

export class PredictionEngine {
  constructor() {
    this.isRunning = false;
    this.history = [];
  }

  start() {
    this.isRunning = true;
    console.log('[ENGINE] Started prediction engine');
  }

  stop() {
    this.isRunning = false;
    console.log('[ENGINE] Stopped prediction engine');
  }

  predictNext(history) {
    if (!this.isRunning) return null;
    
    const analysis = analyzeHistory(history);
    const probability = calculateProbability(analysis);
    
    // Combine analysis with probability model
    // This is a simplified logic for the demo
    const basePrediction = Math.random() * 2 + 1; // Random between 1x and 3x
    const volatilityAdjustment = analysis.volatility > 0.5 ? 0.5 : 0;
    
    return (basePrediction + volatilityAdjustment).toFixed(2);
  }
}

export const engine = new PredictionEngine();
