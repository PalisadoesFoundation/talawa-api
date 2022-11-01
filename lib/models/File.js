const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');
/**
 * @name fileSchema
 * @function
 * @description This is the structure of a file
 * @param {String} name Name
 * @param {String} url URL
 * @param {Number} size Size
 * @param {String} secret Secret
 * @param {Date} createdAt Created at Date
 * @param {String} contentType Content Type
 * @param {String} status Status
 */
const fileSchema = new Schema({
  name: {
    type: String,
    required: true,
    default: uuidv4(),
  },
  url: {
    type: String,
  },
  size: {
    type: Number,
  },
  secret: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  contentType: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('File', fileSchema);
