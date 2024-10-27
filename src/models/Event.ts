import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";
import type { InterfaceRecurrenceRule } from "./RecurrenceRule";
import type { InterfaceAgendaItem } from "./AgendaItem";
import type { InterfaceEventVolunteer } from "./EventVolunteer";

/**
 * Represents a document for an event in the MongoDB database.
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
  title: string;
  updatedAt: Date;
  volunteers: PopulatedDoc<InterfaceEventVolunteer & Document>[];
  volunteerGroups: PopulatedDoc<InterfaceEventVolunteerGroup & Document>[];
  agendaItems: PopulatedDoc<InterfaceAgendaItem & Document>[];
}

/**
 * Mongoose schema definition for an event document.
 * @param title - Title of the event.
 * @param description - Description of the event.
 * @param attendees - Optional attendees information.
 * @param images - Array of image URLs associated with the event.
 * @param location - Optional location of the event.
 * @param latitude - Latitude coordinate of the event location.
 * @param longitude - Longitude coordinate of the event location.
 * @param recurring - Indicates if the event is recurring.
 * @param isRecurringEventException - Indicates if the event is an exception to a recurring pattern.
 * @param isBaseRecurringEvent - Indicates if the event is a base recurring event.
 * @param recurrenceRuleId - Reference to the recurrence rule for recurring events.
 * @param baseRecurringEventId - Reference to the base recurring event for generated instances.
 * @param allDay - Indicates if the event occurs throughout the entire day.
 * @param startDate - Start date of the event.
 * @param endDate - Optional end date of the event.
 * @param startTime - Optional start time of the event.
 * @param endTime - Optional end time of the event.
 * @param isPublic - Indicates if the event is public.
 * @param isRegisterable - Indicates if the event is registerable.
 * @param creatorId - Reference to the user who created the event.
 * @param admins - Array of admins for the event.
 * @param organization - Reference to the organization hosting the event.
 * @param volunteerGroups - Array of volunteer groups associated with the event.
 * @param volunteers - Array of volunteers associated with the event.
 * @param createdAt - Timestamp of when the event was created.
 * @param updatedAt - Timestamp of when the event was last updated.
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
    volunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: "EventVolunteer",
        required: true,
        default: [],
      },
    ],
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

// Apply logging middleware to the schema
createLoggingMiddleware(eventSchema, "Event");

const eventModel = (): Model<InterfaceEvent> =>
  model<InterfaceEvent>("Event", eventSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Event = (models.Event || eventModel()) as ReturnType<
  typeof eventModel
>;
