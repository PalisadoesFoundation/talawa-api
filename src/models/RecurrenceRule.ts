import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceOrganization } from "./Organization";

/**
 * Enumeration for recurrence frequencies.
 */

export enum Frequency {
  YEARLY = "YEARLY",
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY",
  DAILY = "DAILY",
}

/**
 * Enumeration for weekdays.
 */
export enum WeekDays {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

/**
 * Interface representing a document for a recurrence rule in the database (MongoDB).
 */
export interface InterfaceRecurrenceRule {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  baseRecurringEventId: PopulatedDoc<InterfaceEvent & Document>;
  recurrenceRuleString: string;
  recurrenceStartDate: Date;
  recurrenceEndDate: Date;
  frequency: Frequency;
  weekDays: WeekDays[];
  interval: number;
  count: number;
  weekDayOccurenceInMonth: number;
  latestInstanceDate: Date;
}

/**
 * This is the Structure of the RecurringEvent
 * @param organizationId - _id of the organization the evevnts following this recurrence rule belong to
 * @param baseRecurringEventId - _id of the base event common to the recurrence pattern
 * @param recurrenceRuleString - An rrule string representing the recurrence pattern
 * @param recurrenceStartDate - Start date of the recurrence pattern (not necessarily the startDate of the first recurring instance)
 * @param recurrenceEndDate - Start date of the recurrence pattern (not necessarily the startDate of the last recurring instance)
 * @param frequency - Frequency of recurrence
 * @param weekDays - Array containing the days of the week the recurring instance occurs
 * @param interval - Interval of recurrence (i.e. 1 = every week, 2 = every other week, etc.)
 * @param count - Number of recurring instances
 * @param weekDayOccurenceInMonth - Occurence of week day in the month (i.e. 1 = first monday, 3 = third monday, -1 = last monday)
 * @param latestInstanceDate - The startDate of the lastest recurring instance generated using this recurrence rule
 */

const recurrenceRuleSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    baseRecurringEventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    recurrenceRuleString: {
      type: String,
      required: true,
    },
    recurrenceStartDate: {
      type: Date,
      required: true,
    },
    recurrenceEndDate: {
      type: Date,
      required: false,
    },
    frequency: {
      type: String,
      required: true,
      enum: Object.values(Frequency),
    },
    weekDays: { type: [String], required: true, enum: Object.values(WeekDays) },
    latestInstanceDate: {
      type: Date,
      required: true,
    },
    interval: {
      type: Number,
      required: false,
      default: 1,
    },
    count: {
      type: Number,
      required: false,
    },
    weekDayOccurenceInMonth: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const recurrenceRuleModel = (): Model<InterfaceRecurrenceRule> =>
  model<InterfaceRecurrenceRule>("RecurrenceRule", recurrenceRuleSchema);

/**
 * The Mongoose model for the Recurrence Rule.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const RecurrenceRule = (models.RecurrenceRule ||
  recurrenceRuleModel()) as ReturnType<typeof recurrenceRuleModel>;
