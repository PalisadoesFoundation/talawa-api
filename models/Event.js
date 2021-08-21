const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserAttende = new Schema({
  userId: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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

//this is the Structure of the event
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
    ref: 'User',
    required: true,
  },
  registrants: [UserAttende],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

module.exports = mongoose.model('Event', eventSchema);
