const Donation = require('../../models/Donation');
const { ObjectId } = require('mongodb')
/**
 * @name getDonationByOrgId a GraphQL Query
 * @description returns list of  donations as a transactions that matches the provided orgId property from database 
 */
module.exports = async (parent, args) => {
    // return await Donation.findById(id, function (err, res) {
    return await Donation.find({ orgId: ObjectId(args.orgId) }, function (err, res) {

        if (err) {
            console.log(err);
        }
        else {
            return res;
        }
    });
};
