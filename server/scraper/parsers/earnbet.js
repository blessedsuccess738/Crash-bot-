
export const earnBetParser = {
  name: 'EarnBet',
  url: 'https://earnbet.io/crash',
  selectors: {
    multiplier: '.crash-multiplier', // Placeholder
    history: '.crash-history .item', // Placeholder
    betButton: '.bet-button', // Placeholder
    amountInput: '.bet-amount-input' // Placeholder
  },
  parse: async (page) => {
    // Logic to parse EarnBet
    return { multiplier: 1.0, status: 'waiting' };
  }
};
