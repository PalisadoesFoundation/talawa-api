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
  orgId: PopulatedDoc<InterfaceOrganization & Document>;
  disabled: boolean;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `actionItemCategory` that corresponds to `InterfaceCategory` document.
 * @param name - An actionItemCategory to be selected for ActionItems.
 * @param orgId - Organization the actionItemCategory belongs to, refer to the `Organization` model.
 * @param disabled - Whether actionItemCategory is disabled or not.
 * @param createdBy - Task creator, refer to `User` model.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of data updation.
 */

const actionItemCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    createdBy: {
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
