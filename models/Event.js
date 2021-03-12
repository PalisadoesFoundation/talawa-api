const mongoose = require('mongoose');

const { Schema } = mongoose;


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
  allDay: { type: Boolean, required: true },
  startDate: { type: String, required: true },
  endDate: {
    type: String,
    required() {
      return !this.allDay;
    },
  },
  startTime: {
    type: String,
    required() {
      return !this.allDay;
    },
  },
  endTime: {
    type: String,
    required() {
      return !this.allDay;
    },
  },
  recurrance: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ONCE'],
    required() {
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
  registrants: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
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
});

module.exports = mongoose.model('Event', eventSchema);
