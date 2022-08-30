const Donation = require('../../models/Donation');
/**
 * @name createDonation creates a Donation as transaction and returns the same
 * @description creates a document of Donation type and stores it in database
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
    //create MongoDB document
    let donation = new Donation({
        userId: args.userId,
        payPalId: args.payPalId,
        nameOfUser: args.nameOfUser,
        amount: args.amount,
    });
    //store the donation transaction
    donation = await Donation.save();
    return {
        ...donation._doc,
    };
};
