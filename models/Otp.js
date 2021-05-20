const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const otpSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model('Otp', otpSchema);
