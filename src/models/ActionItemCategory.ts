import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceOrganization } from "./Organization";

/**
 * This is an interface that represents a database(MongoDB) document for ActionItemCategory.
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
 * This describes the schema for a `actionItemCategory` that corresponds to `InterfaceCategory` document.
 * @param name - An actionItemCategory to be selected for ActionItems.
 * @param organizationId - Organization the actionItemCategory belongs to, refer to the `Organization` model.
 * @param isDisabled - Whether actionItemCategory is disabled or not.
 * @param creatorId - Task creator, refer to `User` model.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of data updation.
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
  { timestamps: true }
);

const actionItemCategoryModel = (): Model<InterfaceActionItemCategory> =>
  model<InterfaceActionItemCategory>("ActionItemCategory", actionItemCategorySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ActionItemCategory = (models.ActionItemCategory || actionItemCategoryModel()) as ReturnType<
  typeof actionItemCategoryModel
>;
