const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');
const Task = require('./Task');
/**
 * @name UserAttende
 * @function
 * @description This is the Structure of the User Attendee
 * @param {String} userId User-id
 * @param {Schema.Types.ObjectId} user User details
 * @param {String} status whether the User is active, blocked, or delete
 * @param {Date} createdAt Created Date
 */
const UserAttende = new Schema({
  userId: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * @name eventSchema
 * @function
 * @description This is the Structure of the Event
 * @param {String} title Title of the event
 * @param {String} description Description of the event
 * @param {String} attendees Attendees
 * @param {String} location Location of the event
 * @param {Number} latitude Latitude
 * @param {Number} longitude Longitude
 * @param {Boolean} recurring Is the event recurring
 * @param {Boolean} allDay Is the event occuring all day
 * @param {String} startDate Start Date
 * @param {String} endDate End date
 * @param {String} startTime Start Time
 * @param {string} endTime End Time
 * @param {string} recurrance Periodicity of recurrance of the event
 * @param {Boolean} isPublic Is the event public
 * @param {Boolean} isRegisterable Is the event Registrable
 * @param {Schema.Types.ObjectId} creator Creator of the event
 * @param {Schema.Types.ObjectId[]} admins Admins
 * @param {Schema.Types.ObjectId} organization Organization
 * @param {Schema.Types.ObjectId} tasks Tasks
 * @param {String} status whether the event is active, blocked, or deleted.
 */
const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  attendees: {
    type: String,
    required: false,
  },
  location: {
    type: String,
  },
  latitude: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  },
  recurring: {
    type: Boolean,
    required: true,
    default: false,
  },
  allDay: {
    type: Boolean,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: function () {
      return !this.allDay;
    },
  },
  startTime: {
    type: String,
    required: function () {
      return !this.allDay;
    },
  },
  endTime: {
    type: String,
    required: function () {
      return !this.allDay;
    },
  },
  recurrance: {
    type: String,
    default: 'ONCE',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ONCE'],
    required: function () {
      return this.recurring;
    },
  },
  isPublic: {
    type: Boolean,
    required: true,
  },
  isRegisterable: {
    type: Boolean,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  registrants: [UserAttende],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
  ],
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: Task,
    },
  ],
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('Event', eventSchema);
