const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name eventProjectSchema
 * @function
 * @description This is the Structure of the event project
 * @param {String} title Title
 * @param {String} description description
 * @param {Date} createdAt Created at Date
 * @param {Schema.Types.ObjectId} event Event
 * @param {Schema.Types.ObjectId} creator Creator
 * @param {Schema.Types.ObjectId[]} tasks Tasks
 * @param {String} status Status
 */
const eventProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('EventProject', eventProjectSchema);
