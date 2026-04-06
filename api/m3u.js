const m3uHandler = require('./proxy/m3u');

module.exports = async function handler(req, res) {
  return m3uHandler(req, res);
};
