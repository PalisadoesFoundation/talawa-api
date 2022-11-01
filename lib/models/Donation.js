const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * @name donationSchema
 * @function
 * @description This is the Structure of the Donation
 * @param {Schema.Types.ObjectId} userId User-id
 * @param {Schema.Types.ObjectId} orgId Organization-id
 * @param {String} nameOfOrg Name of the organization
 * @param {String} payPalId PayPalId
 * @param {String} nameOfUser Name of the user
 * @param {Numbe} amount Amount of the donation
 */
const donationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  orgId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  nameOfOrg: {
    type: String,
    required: true,
  },
  payPalId: {
    type: String,
    required: true,
  },
  nameOfUser: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Donation', donationSchema);
