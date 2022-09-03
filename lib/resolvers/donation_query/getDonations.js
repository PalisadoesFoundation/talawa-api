const Donation = require('../../models/Donation');
/**
 * @name getPlugins a GraphQL Query
 * @description returns list of donations as a transactions from database
 */
module.exports = async () => {
  return await Donation.find();
};
