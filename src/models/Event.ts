import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { InterfaceOrganization } from "./Organization";
import { InterfaceTask } from "./Task";
import { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a user attendee in the database(MongoDB).
 */
export interface InterfaceUserAttende {
  userId: string;
  user: PopulatedDoc<InterfaceUser & Document>;
  status: string;
  createdAt: Date;
}
/**
 * This is the Structure of the User Attendee
 * @param userId - User-id
 * @param user - User details
 * @param status - whether the User is active, blocked, or delete
 * @param createdAt - Creation Date
 */
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
/**
 * This is an interface representing a document for an event in the database(MongoDB).
 */
export interface InterfaceEvent {
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
  creator: PopulatedDoc<InterfaceUser & Document>;
  registrants: Array<PopulatedDoc<InterfaceUserAttende & Document>>;
  admins: Array<PopulatedDoc<InterfaceUser & Document>>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  tasks: Array<PopulatedDoc<InterfaceTask & Document>>;
  status: string;
}
/**
 * This is the Structure of the Event
 * @param title - Title of the event
 * @param description - Description of the event
 * @param attendees - Attendees
 * @param location - Location of the event
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @param recurring - Is the event recurring
 * @param allDay - Is the event occuring all day
 * @param startDate - Start Date
 * @param endDate - End date
 * @param startTime - Start Time
 * @param endTime - End Time
 * @param recurrance - Periodicity of recurrance of the event
 * @param isPublic - Is the event public
 * @param isRegisterable - Is the event Registrable
 * @param creator - Creator of the event
 * @param admins - Admins
 * @param organization - Organization
 * @param tasks - Tasks
 * @param status - whether the event is active, blocked, or deleted.
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
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: function (): () => boolean {
      // @ts-ignore
      return !this.allDay;
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

const eventModel = () => model<InterfaceEvent>("Event", eventSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Event = (models.Event || eventModel()) as ReturnType<
  typeof eventModel
>;
