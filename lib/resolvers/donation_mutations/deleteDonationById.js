const Donation = require('../../models/Donation');
const { ObjectID } = require('mongodb');
/**
 * @name deleteDonationById
 * @description  delets a Donation record from the database and returns it if successful.
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  //delete donation transaction that matches with _id
  let donation = await Donation.deleteOne({ _id: ObjectID(args.id) });
  return { success: donation.deletedCount ? true : false };
};
