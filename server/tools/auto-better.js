export const autoBetter = {
  name: 'Auto Better',
  description: 'Automates betting actions based on predictions',
  
  bet: async (page, amount, multiplier) => {
    if (!page || !amount || !multiplier) return false;
    
    try {
      // Example selector for bet button
      await page.click('.bet-btn');
      console.log('[Auto Better] Placed bet:', amount, 'at', multiplier);
      return true;
    } catch (e) {
      console.error('[Auto Better] Failed to place bet:', e);
      return false;
    }
  }
};
