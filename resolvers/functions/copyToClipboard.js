const ncp = require('copy-paste');

module.exports = (text) => {
  // Only copies in development or test mode
  if (process.env.NODE_ENV !== 'production') {
    ncp.copy(text);
  }
};
