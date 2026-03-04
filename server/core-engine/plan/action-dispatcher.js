export class ActionDispatcher {
  dispatch(predictedCrash) {
    let action = 'WAIT';
    
    if (predictedCrash >= 2.00) {
      action = 'BET';
    } else {
      action = 'SKIP';
    }

    return {
      target: predictedCrash,
      action,
      timestamp: Date.now()
    };
  }
}
