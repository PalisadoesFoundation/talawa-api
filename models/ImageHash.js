const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const imageHashSchema = new Schema({
  hashValue: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  numberOfUses: {
    type: Number,
    default: 0,
    required: true,
  },
});

module.exports = mongoose.model('ImageHash', imageHashSchema);
