import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceActionItemCategory } from "./ActionItemCategory";
import { MILLISECONDS_IN_A_WEEK } from "../constants";

/**
 * This is an interface that represents a database(MongoDB) document for ActionItem [test change].
 */

export interface InterfaceActionItem {
  _id: Types.ObjectId;
  assigneeId: PopulatedDoc<InterfaceUser & Document>;
  assignerId: PopulatedDoc<InterfaceUser & Document>;
  actionItemCategoryId: PopulatedDoc<InterfaceActionItemCategory & Document>;
  preCompletionNotes: string;
  postCompletionNotes: string;
  assignmentDate: Date;
  dueDate: Date;
  completionDate: Date;
  isCompleted: boolean;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `ActionItem` that corresponds to `InterfaceActionItem` document.
 * @param assigneeId - User to whom the ActionItem is assigned, refer to `User` model.
 * @param assignerId - User who assigned the ActionItem, refer to the `User` model.
 * @param actionItemCategoryId - ActionItemCategory to which the ActionItem is related, refer to the `ActionItemCategory` model.
 * @param preCompletionNotes - Notes prior to completion.
 * @param postCompletionNotes - Notes on completion.
 * @param assignmentDate - Date of assignment.
 * @param dueDate - Due date.
 * @param completionDate - Completion date.
 * @param isCompleted - Whether the ActionItem has been completed.
 * @param eventId - Event to which the ActionItem is related, refer to the `Event` model.
 * @param creatorId - User who created the ActionItem, refer to the `User` model.
 * @param createdAt - Timestamp when the ActionItem was created.
 * @param updatedAt - Timestamp when the ActionItem was last updated.
 */

const actionItemSchema = new Schema(
  {
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionItemCategoryId: {
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
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const actionItemModel = (): Model<InterfaceActionItem> =>
  model<InterfaceActionItem>("ActionItem", actionItemSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ActionItem = (models.ActionItem ||
  actionItemModel()) as ReturnType<typeof actionItemModel>;
