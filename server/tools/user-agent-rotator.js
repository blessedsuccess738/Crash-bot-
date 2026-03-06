
const userAgents = require('../config/user-agents');

module.exports = {
  getRandomUserAgent: () => {
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
  }
};
