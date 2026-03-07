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
        return Array.from(items).map(item => {
          const text = item.innerText.trim();
          if (!text) return null;
          
          // Handle cases like "1.23x", "x1.23", "Crash at 1.23x", "1,23"
          // We prefer numbers followed by 'x', otherwise take the first number found
          const normalized = text.replace(',', '.');
          const match = normalized.match(/(\d+\.?\d*)\s*x/i) || normalized.match(/(\d+\.?\d*)/);
          if (match) {
            const val = parseFloat(match[1]);
            return isNaN(val) ? null : val;
          }
          return null;
        }).filter(v => v !== null);
      });
      return history;
    } catch (e) {
      console.error('[STAKE PARSER] Error parsing history:', e);
      return [];
    }
  }
};
