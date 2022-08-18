import { Schema, Types, model, Model, PopulatedDoc } from 'mongoose';
import { Interface_Task } from './Task';
import { Interface_User } from './User';

export interface Interface_UserAttende {
  userId: string;
  user: PopulatedDoc<Interface_User>;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt: Date;
}

const userAttendeSchema = new Schema<
  Interface_UserAttende,
  Model<Interface_UserAttende>,
  Interface_UserAttende
>({
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
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
});

export interface Interface_Event {
  title: string;
  description: string;
  attendees?: string;
  location?: string;
  recurring: boolean;
  allDay: boolean;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  recurrance?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ONCE';
  isPublic: boolean;
  isRegisterable: boolean;
  creator: PopulatedDoc<Interface_User>;
  registrants: Array<PopulatedDoc<Interface_UserAttende>>;
  admins: Array<PopulatedDoc<Interface_User>>;
  organization: Types.ObjectId;
  tasks: Array<PopulatedDoc<Interface_Task>>;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const eventSchema = new Schema<
  Interface_Event,
  Model<Interface_Event>,
  Interface_Event
>({
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
      // @ts-ignore
      return !this.allDay;
    },
  },
  startTime: {
    type: String,
    required: function () {
      // @ts-ignore
      return !this.allDay;
    },
  },
  endTime: {
    type: String,
    required: function () {
      // @ts-ignore
      return !this.allDay;
    },
  },
  recurrance: {
    type: String,
    required: function () {
      // @ts-ignore
      return this.recurring;
    },
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ONCE'],
    default: 'ONCE',
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
  registrants: [userAttendeSchema],
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
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const Event = model<Interface_Event>('Event', eventSchema);
