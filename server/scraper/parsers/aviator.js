export const aviatorParser = {
  name: 'Aviator Crash Parser',
  description: 'Extracts live crash multiplier from Aviator (Spribe)',
  
  // Selectors for Aviator
  selectors: {
    multiplier: '.payouts-block .payout', // Example selector
    history: '.history-list .item',
    betButton: '.bet-btn',
    inputAmount: '.bet-input'
  },

  parseMultiplier: async (page) => {
    try {
      const multiplier = await page.evaluate(() => {
        const el = document.querySelector('.payouts-block .payout');
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
        const items = document.querySelectorAll('.history-list .item');
        return Array.from(items).map(item => parseFloat(item.innerText.replace('x', '')));
      });
      return history;
    } catch (e) {
      return [];
    }
  }
};
