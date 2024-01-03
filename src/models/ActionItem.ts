import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceCategory } from "./Category";

/**
 * This is an interface that represents a database(MongoDB) document for ActionItem.
 */

export interface InterfaceActionItem {
  _id: Types.ObjectId;
  assignedTo: PopulatedDoc<InterfaceUser & Document>;
  assignedBy: PopulatedDoc<InterfaceUser & Document>;
  category: PopulatedDoc<InterfaceCategory & Document>;
  preCompletionNotes: string;
  postCompletionNotes: string;
  assignmentDate: Date;
  dueDate: Date;
  completionDate: Date;
  completed: boolean;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `ActionItem` that corresponds to `InterfaceActionItem` document.
 * @param assignedTo - User to whom the ActionItem is assigned, refer to `User` model.
 * @param assignedBy - User who assigned the ActionItem, refer to the `User` model.
 * @param category - Category to which the ActionItem is related, refer to the `Category` model.
 * @param preCompletionNotes - Notes prior to completion.
 * @param postCompletionNotes - Notes on completion.
 * @param assignmentDate - Date of assignment.
 * @param dueDate - Due date.
 * @param completionDate - Completion date.
 * @param completed - Whether the ActionItem has been completed.
 * @param eventId - Event to which the ActionItem is related, refer to the `Event` model.
 * @param createdBy - User who created the ActionItem, refer to the `User` model.
 * @param updatedBy - User who last updated the ActionItem, refer to the `User` model.
 * @param createdAt - Timestamp when the ActionItem was created.
 * @param updatedAt - Timestamp when the ActionItem was last updated.
 */

const actionItemSchema = new Schema(
  {
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
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
      default: Date.now(),
    },
    dueDate: {
      type: Date,
      default: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    completionDate: {
      type: Date,
      default: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    completed: {
      type: Boolean,
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
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
