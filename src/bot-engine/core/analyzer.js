
export const analyzeHistory = (history) => {
  if (!history || history.length === 0) return { volatility: 0, trend: 'neutral' };

  const values = history.map(h => parseFloat(h));
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate volatility (standard deviation)
  const variance = values.reduce((a, b) => a + Math.pow(b - average, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);

  // Determine trend
  const trend = values[0] > values[values.length - 1] ? 'up' : 'down';

  return {
    average,
    volatility,
    trend
  };
};
