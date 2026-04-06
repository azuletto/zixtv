const fetchHandler = require('./proxy/fetch');

module.exports = async function handler(req, res) {
  return fetchHandler(req, res);
};
