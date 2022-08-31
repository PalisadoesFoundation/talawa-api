const Donation = require('../../models/Donation');
const { ObjectId } = require("mongodb")
/**
 * @name getDonationsById a GraphQL Query
 * @description returns donation as a transaction that matches the provided Id property from database 
 */
module.exports = async (parent, args) => {
    return await Donation.findById(args.id, function (err, res) {
        if (err) {
            console.log(err);
        }
        else {
            return res._doc;
        }
    });
};
