export class NextTickPredictor {
  predict(analysis) {
    let predictedCrash = 1.00;
    
    if (analysis.trend === 'up') {
      predictedCrash = (Math.random() * 3) + 2.00; // Predict between 2.00x and 5.00x
    } else {
      predictedCrash = (Math.random() * 0.5) + 1.10; // Predict low
    }

    return parseFloat(predictedCrash.toFixed(2));
  }
}
