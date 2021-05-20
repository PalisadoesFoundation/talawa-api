const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const otpSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Otp', otpSchema);
