const Donation = require('../../models/Donation');
/**
 * @name getPluginsById a GraphQL Query
 * @description returns donation as a transaction that matches the provided Id property from database 
 */
module.exports = async (id) => {
    return await Donation.findById(id, function (err, res) {
        if (err) {
            console.log(err);
        }
        else {
            return res;
        }
    });
};
