const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name imageHashSchema
 * @function
 * @description This is the structure of a image hash.
 * @param {String} hashValue Hash value of an image.
 * @param {String} fileName Image file name.
 * @param {Number} numberOfUses Number of times used.
 * @param {String} status Status.
 */
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
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('ImageHash', imageHashSchema);
