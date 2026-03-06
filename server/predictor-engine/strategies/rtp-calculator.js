export const rtpCalculator = {
  name: 'RTP Calculator',
  description: 'Calculates Return to Player (RTP) percentage in real-time',
  
  calculate: (history) => {
    if (!history || history.length < 10) return 0;
    
    const last10 = history.slice(-10);
    const sum = last10.reduce((acc, val) => acc + val, 0);
    const rtp = (sum / 10) * 100; // Simplified RTP calculation
    
    return {
      rtp: rtp.toFixed(2),
      status: rtp > 98 ? 'HIGH_PAYOUT' : rtp < 95 ? 'LOW_PAYOUT' : 'NORMAL',
      recommendation: rtp > 98 ? 'BET' : 'WAIT'
    };
  }
};
