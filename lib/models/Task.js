const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name taskSchema
 * @description This is the structure of a Task Object.
 * @function
 * @param {String} title Task title.
 * @param {String} description Task description.
 * @param {String} status Status.
 * @param {Date} createdAt Time stamp of data creation.
 * @param {Date} deadline Task deadline.
 * @param {Schema.Types.ObjectId} event Event object for which task is added, refer to `Event` model.
 * @param {Schema.Types.ObjectId} creator Task creator, refer to `User` model.
 */
const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  createdAt: { type: Date, default: Date.now },
  deadline: { type: Date },
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
});

module.exports = mongoose.model('Task', taskSchema);
