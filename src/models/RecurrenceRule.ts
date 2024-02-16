import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";

/**
 * This is an interface representing a document for a recurrence rule in the database(MongoDB).
 */

export enum Frequency {
  YEARLY = "YEARLY",
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY",
  DAILY = "DAILY",
}

export enum WeekDays {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export interface InterfaceRecurrenceRule {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  baseRecurringEventId: PopulatedDoc<InterfaceEvent & Document>;
  recurrenceRuleString: string;
  startDate: Date;
  endDate: Date;
  frequency: Frequency;
  count: number;
  weekDays: WeekDays[];
  latestInstanceDate: Date;
}

/**
 * This is the Structure of the RecurringEvent
 * @param organizationId - _id of the organization the evevnts following this recurrence rule belong to
 * @param baseRecurringEventId - _id of the base event common to the recurrence pattern
 * @param recurrenceRuleString - An rrule string representing the recurrence pattern
 * @param startDate - Start date of the recurrence pattern (not necessarily the startDate of the first recurring instance)
 * @param endDate - Start date of the recurrence pattern (not necessarily the startDate of the last recurring instance)
 * @param frequency - Frequency of recurrence
 * @param count - Number of recurring instances
 * @param weekDays - Array containing the days of the week the recurring instance occurs
 * @param latestInstanceDate - The startDate of the last recurring instance generated using this recurrence rule
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    frequency: {
      type: String,
      required: true,
      enum: Object.values(Frequency),
    },
    count: {
      type: Number,
      required: false,
    },
    weekDays: { type: [String], required: true, enum: Object.values(WeekDays) },
    latestInstanceDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const recurrenceRuleModel = (): Model<InterfaceRecurrenceRule> =>
  model<InterfaceRecurrenceRule>("RecurrenceRule", recurrenceRuleSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const RecurrenceRule = (models.RecurrenceRule ||
  recurrenceRuleModel()) as ReturnType<typeof recurrenceRuleModel>;
