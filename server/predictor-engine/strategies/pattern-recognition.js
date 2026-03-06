export const patternRecognition = {
  name: 'Pattern Recognition Strategy',
  description: 'Analyzes crash history for common patterns (e.g., trains, streaks)',
  
  analyze: (history) => {
    if (!history || history.length < 5) return null;
    
    const last5 = history.slice(-5);
    const last10 = history.slice(-10);
    
    // Check for "Train" (consecutive low crashes)
    const trainLength = last5.filter(x => x < 2.0).length;
    if (trainLength >= 4) {
      return {
        type: 'TRAIN_DETECTED',
        confidence: 0.8,
        prediction: 'HIGH',
        reason: 'Detected 4+ low crashes in a row. High multiplier likely soon.'
      };
    }
    
    // Check for "Streak" (consecutive high crashes)
    const streakLength = last5.filter(x => x >= 2.0).length;
    if (streakLength >= 3) {
      return {
        type: 'STREAK_DETECTED',
        confidence: 0.6,
        prediction: 'LOW',
        reason: 'Detected 3+ high crashes in a row. Correction likely soon.'
      };
    }
    
    return {
      type: 'NO_PATTERN',
      confidence: 0.2,
      prediction: 'WAIT',
      reason: 'No clear pattern detected.'
    };
  }
};
