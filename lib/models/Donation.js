const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const donationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
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
    }
});

module.exports = mongoose.model('Donation', donationSchema);
