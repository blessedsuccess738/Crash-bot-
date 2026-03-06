export const stakeParser = {
  name: 'Stake Crash Parser',
  description: 'Extracts live crash multiplier from Stake.com',
  
  // Selectors for Stake Crash
  selectors: {
    multiplier: '.crash-multiplier', // Example selector
    history: '.crash-history .history-item',
    betButton: '.bet-button',
    inputAmount: '.bet-amount-input'
  },

  parseMultiplier: async (page) => {
    try {
      const multiplier = await page.evaluate(() => {
        const el = document.querySelector('.crash-multiplier');
        return el ? parseFloat(el.innerText.replace('x', '')) : null;
      });
      return multiplier;
    } catch (e) {
      return null;
    }
  },

  parseHistory: async (page) => {
    try {
      const history = await page.evaluate(() => {
        const items = document.querySelectorAll('.crash-history .history-item');
        return Array.from(items).map(item => parseFloat(item.innerText.replace('x', '')));
      });
      return history;
    } catch (e) {
      return [];
    }
  }
};
