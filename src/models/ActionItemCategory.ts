import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceOrganization } from "./Organization";

/**
 * Represents a database document for ActionItemCategory in MongoDB.
 */
export interface InterfaceActionItemCategory {
  _id: Types.ObjectId;
  name: string;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  isDisabled: boolean;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for ActionItemCategory document.
 * @param name - The name of the action item category.
 * @param organizationId - The ID of the organization the category belongs to, referencing the Organization model.
 * @param isDisabled - Indicates if the action item category is disabled.
 * @param creatorId - The ID of the user who created the action item category, referencing the User model.
 * @param createdAt - Timestamp of when the data was created.
 * @param updatedAt - Timestamp of when the data was last updated.
 */
const actionItemCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isDisabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexing for organizationId and name to ensure uniqueness
actionItemCategorySchema.index(
  { organizationId: 1, name: 1 },
  { unique: true },
);

/**
 * Returns the Mongoose Model for ActionItemCategory to prevent OverwriteModelError.
 */
const actionItemCategoryModel = (): Model<InterfaceActionItemCategory> =>
  model<InterfaceActionItemCategory>(
    "ActionItemCategory",
    actionItemCategorySchema,
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ActionItemCategory = (models.ActionItemCategory ||
  actionItemCategoryModel()) as ReturnType<typeof actionItemCategoryModel>;
