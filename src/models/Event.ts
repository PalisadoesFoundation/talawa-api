import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";
import type { InterfaceRecurrenceRule } from "./RecurrenceRule";
import type { InterfaceAgendaItem } from "./AgendaItem";

/**
 * This is an interface representing a document for an event in the database(MongoDB).
 */
export interface InterfaceEvent {
  _id: Types.ObjectId;
  admins: PopulatedDoc<InterfaceUser & Document>[];
  allDay: boolean;
  attendees: string | undefined;
  baseRecurringEventId: PopulatedDoc<InterfaceEvent & Document>;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  description: string;
  endDate: string | undefined;
  endTime: string | undefined;
  images: string[];
  isBaseRecurringEvent: boolean;
  isPublic: boolean;
  isRecurringEventException: boolean;
  isRegisterable: boolean;
  latitude: number | undefined;
  location: string | undefined;
  longitude: number;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  recurrance: string;
  recurrenceRuleId: PopulatedDoc<InterfaceRecurrenceRule & Document>;
  recurring: boolean;
  startDate: string;
  startTime: string | undefined;
  status: string;
  title: string;
  updatedAt: Date;
  volunteerGroups: PopulatedDoc<InterfaceEventVolunteerGroup & Document>[];
  agendaItems: PopulatedDoc<InterfaceAgendaItem & Document>[];
}

/**
 * This is the Structure of the Event
 * @param admins - Admins
 * @param allDay - Is the event occuring all day
 * @param attendees - Attendees
 * @param baseRecurringEventId - Id of the true recurring event used for generating this instance
 * @param createdAt - Timestamp of event creation
 * @param creatorId - Creator of the event
 * @param description - Description of the event
 * @param endDate - End date
 * @param endTime - End Time
 * @param images -Event Flyer
 * @param isBaseRecurringEvent - Is the event a true recurring event that is used for generating new instances
 * @param isPublic - Is the event public
 * @param isRecurringEventException - Is the event an exception to the recurring pattern it was following
 * @param isRegisterable - Is the event Registrable
 * @param latitude - Latitude
 * @param location - Location of the event
 * @param longitude - Longitude
 * @param organization - Organization
 * @param recurrance - Periodicity of recurrance of the event
 * @param recurrenceRuleId - Id of the recurrence rule document containing the recurrence pattern for the event
 * @param recurring - Is the event recurring
 * @param startDate - Start Date
 * @param startTime - Start Time
 * @param status - whether the event is active, blocked, or deleted.
 * @param title - Title of the event
 * @param updatedAt - Timestamp of event updation
 * @param volunteerGroups - event volunteer groups for the event
 */

const eventSchema = new Schema(
  {
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
    images: {
      type: [String],
      required: false,
      validate: {
        validator: function (images: string[]): boolean {
          return images.length <= 5;
        },
        message: "Up to 5 images are allowed.",
      },
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
    isRecurringEventException: {
      type: Boolean,
      required: true,
      default: false,
    },
    isBaseRecurringEvent: {
      type: Boolean,
      required: true,
      default: false,
    },
    recurrenceRuleId: {
      type: Schema.Types.ObjectId,
      ref: "RecurrenceRule",
      required: false,
    },
    baseRecurringEventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: false,
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
      required: false,
    },
    startTime: {
      type: Date,
      required: function (this: InterfaceEvent): boolean {
        return !this.allDay;
      },
    },
    endTime: {
      type: Date,
      required: function (this: InterfaceEvent): boolean {
        return !this.allDay;
      },
    },
    recurrance: {
      type: String,
      required: function (this: InterfaceEvent): boolean {
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
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
    volunteerGroups: [
      {
        type: Schema.Types.ObjectId,
        ref: "EventVolunteerGroup",
        required: true,
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  },
);

createLoggingMiddleware(eventSchema, "Event");

const eventModel = (): Model<InterfaceEvent> =>
  model<InterfaceEvent>("Event", eventSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Event = (models.Event || eventModel()) as ReturnType<
  typeof eventModel
>;
