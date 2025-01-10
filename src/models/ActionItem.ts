import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import mongoose from "mongoose";
// eslint-disable-next-line @typescript-eslint/naming-convention
const { Schema, model, models } = mongoose;
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceActionItemCategory } from "./ActionItemCategory";
import { MILLISECONDS_IN_A_WEEK } from "../constants";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";
import type { InterfaceEventVolunteer } from "./EventVolunteer";

/**
 * Interface representing a database document for ActionItem in MongoDB.
 */
export interface InterfaceActionItem {
  _id: Types.ObjectId;
  assignee: PopulatedDoc<InterfaceEventVolunteer & Document>;
  assigneeGroup: PopulatedDoc<InterfaceEventVolunteerGroup & Document>;
  assigneeUser: PopulatedDoc<InterfaceUser & Document>;
  assigneeType: "EventVolunteer" | "EventVolunteerGroup" | "User";
  assigner: PopulatedDoc<InterfaceUser & Document>;
  actionItemCategory: PopulatedDoc<
    InterfaceActionItemCategory & Document
  > | null;
  preCompletionNotes: string;
  postCompletionNotes: string;
  assignmentDate: Date;
  dueDate: Date;
  completionDate: Date;
  isCompleted: boolean;
  allottedHours: number | null;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  event: PopulatedDoc<InterfaceEvent & Document>;
  creator: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines the schema for the ActionItem document.
 * @param assignee - User to whom the ActionItem is assigned.
 * @param assigneeGroup - Group to whom the ActionItem is assigned.
 * @param assigneeUser - Organization User to whom the ActionItem is assigned.
 * @param assigneeType - Type of assignee (User or Group).
 * @param assigner - User who assigned the ActionItem.
 * @param actionItemCategory - ActionItemCategory to which the ActionItem belongs.
 * @param preCompletionNotes - Notes recorded before completion.
 * @param postCompletionNotes - Notes recorded after completion.
 * @param assignmentDate - Date when the ActionItem was assigned.
 * @param dueDate - Due date for the ActionItem.
 * @param completionDate - Date when the ActionItem was completed.
 * @param isCompleted - Flag indicating if the ActionItem is completed.
 * @param allottedHours - Optional: Number of hours allotted for the ActionItem.
 * @param event - Optional: Event to which the ActionItem is related.
 * @param organization - Organization to which the ActionItem belongs.
 * @param creator - User who created the ActionItem.
 * @param createdAt - Timestamp when the ActionItem was created.
 * @param updatedAt - Timestamp when the ActionItem was last updated.
 */
const actionItemSchema = new Schema(
  {
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "EventVolunteer",
    },
    assigneeGroup: {
      type: Schema.Types.ObjectId,
      ref: "EventVolunteerGroup",
    },
    assigneeUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assigneeType: {
      type: String,
      required: true,
      enum: ["EventVolunteer", "EventVolunteerGroup", "User"],
    },
    assigner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionItemCategory: {
      type: Schema.Types.ObjectId,
      ref: "ActionItemCategory",
      required: true,
    },
    preCompletionNotes: {
      type: String,
    },
    postCompletionNotes: {
      type: String,
    },
    assignmentDate: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    dueDate: {
      type: Date,
      required: true,
      default: Date.now() + MILLISECONDS_IN_A_WEEK,
    },
    completionDate: {
      type: Date,
      required: true,
      default: Date.now() + MILLISECONDS_IN_A_WEEK,
    },
    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    allottedHours: {
      type: Number,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }, // Automatic timestamps for createdAt and updatedAt fields
);

/**
 * Retrieves or creates the ActionItem model.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const actionItemModel = (): Model<InterfaceActionItem> =>
  model<InterfaceActionItem>("ActionItem", actionItemSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ActionItem = (models.ActionItem ||
  actionItemModel()) as ReturnType<typeof actionItemModel>;
