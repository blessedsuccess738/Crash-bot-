export const bcgameParser = {
  name: 'BC.Game Crash Parser',
  description: 'Extracts live crash multiplier from BC.Game',
  
  // Selectors for BC.Game Crash
  selectors: {
    multiplier: '.crash-game .multiplier', // Example selector
    history: '.crash-game .history-list .item',
    betButton: '.bet-control .bet-btn',
    inputAmount: '.bet-control input[type="number"]'
  },

  parseMultiplier: async (page) => {
    try {
      const multiplier = await page.evaluate(() => {
        const el = document.querySelector('.crash-game .multiplier');
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
        const items = document.querySelectorAll('.crash-game .history-list .item');
        return Array.from(items).map(item => parseFloat(item.innerText.replace('x', '')));
      });
      return history;
    } catch (e) {
      return [];
    }
  }
};
