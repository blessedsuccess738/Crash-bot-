
export const xbetParser = {
  name: '1xBet',
  url: 'https://1xbet.ng/en/games/crash',
  selectors: {
    multiplier: '.c-crash-game__multiplier', // Placeholder selector
    history: '.c-crash-game__history-item',
    betButton: '.c-bet-box__btn',
    inputAmount: '.c-bet-box__input'
  },

  parseMultiplier: async (page) => {
    try {
      const multiplier = await page.evaluate(() => {
        const el = document.querySelector('.c-crash-game__multiplier');
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
        const items = document.querySelectorAll('.c-crash-game__history-item');
        return Array.from(items).map(item => parseFloat(item.innerText.replace('x', '')));
      });
      return history;
    } catch (e) {
      return [];
    }
  }
};
