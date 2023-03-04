import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { MONGOOSE_EVENT_ERRORS } from "../constants";
import { Interface_Organization } from "./Organization";
import { Interface_Task } from "./Task";
import { Interface_User } from "./User";

export interface Interface_UserAttende {
  userId: string;
  user: PopulatedDoc<Interface_User & Document>;
  status: string;
  createdAt: Date;
}

const userAttendeSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export interface Interface_Event {
  _id: Types.ObjectId;
  title: string;
  description: string;
  attendees: string | undefined;
  location: string | undefined;
  latitude: number | undefined;
  longitude: number;
  recurring: boolean;
  allDay: boolean;
  startDate: string;
  endDate: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  recurrance: string;
  isPublic: boolean;
  isRegisterable: boolean;
  creator: PopulatedDoc<Interface_User & Document>;
  registrants: Array<PopulatedDoc<Interface_UserAttende & Document>>;
  admins: Array<PopulatedDoc<Interface_User & Document>>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  tasks: Array<PopulatedDoc<Interface_Task & Document>>;
  status: string;
}

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: [256, MONGOOSE_EVENT_ERRORS.TITLE_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_EVENT_ERRORS.TITLE_ERRORS.regexError,
    ],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: [500, MONGOOSE_EVENT_ERRORS.DESCRIPTION_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_EVENT_ERRORS.DESCRIPTION_ERRORS.regexError,
    ],
  },
  attendees: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    trim: true,
    maxLength: [50, MONGOOSE_EVENT_ERRORS.LOCATION_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_EVENT_ERRORS.LOCATION_ERRORS.regexError,
    ],
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
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: function (): () => boolean {
      // @ts-ignore
      return !this.allDay;
    },
    validate: {
      validator: function (value: any): () => boolean {
        // @ts-ignore
        return value >= this.startDate;
      },
      message: MONGOOSE_EVENT_ERRORS.DATE_ERROR.endDateError,
    },
  },
  startTime: {
    type: Date,
    required: function (): () => boolean {
      // @ts-ignore
      return !this.allDay;
    },
  },
  endTime: {
    type: Date,
    required: function (): () => boolean {
      // @ts-ignore
      return !this.allDay;
    },
  },
  recurrance: {
    type: String,
    required: function (): () => boolean {
      // @ts-ignore
      return this.recurring;
    },
    enum: ["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
    default: "ONCE",
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
    ref: "User",
    required: true,
  },
  registrants: [userAttendeSchema],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

const EventModel = () => model<Interface_Event>("Event", eventSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Event = (models.Event || EventModel()) as ReturnType<
  typeof EventModel
>;
