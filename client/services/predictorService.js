// Bridge between UI and Bot Engine via API
export const getPrediction = async (history) => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history }),
    });
    
    if (!response.ok) {
      throw new Error('Prediction failed');
    }
    
    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error('Error getting prediction:', error);
    // Fallback for demo if API fails
    return (Math.random() * 2 + 1).toFixed(2);
  }
};
