
export const calculateProbability = (analysis) => {
  // Simple probability model based on analysis
  // In a real system, this would use more complex math
  
  let crashProbability = 0.5; // Default 50%

  if (analysis.trend === 'down') {
    crashProbability += 0.1;
  }

  if (analysis.volatility > 2.0) {
    crashProbability += 0.2; // High volatility increases crash risk
  }

  return {
    crashProbability,
    safeMultiplier: (1 / crashProbability).toFixed(2)
  };
};
