
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '../../data/sessions.json');

module.exports = {
  saveSession: (site, cookies) => {
    let sessions = {};
    if (fs.existsSync(SESSION_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSION_FILE));
    }
    sessions[site] = cookies;
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
  },
  loadSession: (site) => {
    if (fs.existsSync(SESSION_FILE)) {
      const sessions = JSON.parse(fs.readFileSync(SESSION_FILE));
      return sessions[site] || null;
    }
    return null;
  }
};
