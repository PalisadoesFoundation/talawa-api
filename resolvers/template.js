const authCheck = require('./functions/authCheck');

module.exports = async (parent, args, context) => {
  authCheck(context);
};
