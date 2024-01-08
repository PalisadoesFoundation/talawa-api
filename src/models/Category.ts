import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceOrganization } from "./Organization";

/**
 * This is an interface that represents a database(MongoDB) document for Category.
 */

export interface InterfaceCategory {
  _id: Types.ObjectId;
  category: string;
  orgId: PopulatedDoc<InterfaceOrganization & Document>;
  disabled: boolean;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `category` that corresponds to `InterfaceCategory` document.
 * @param category - A category to be selected for ActionItems.
 * @param orgId - Organization the category belongs to, refer to the `Organization` model.
 * @param disabled - Whether category is disabled or not.
 * @param createdBy - Task creator, refer to `User` model.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of data updation.
 */

const categorySchema = new Schema(
  {
    category: {
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

const categoryModel = (): Model<InterfaceCategory> =>
  model<InterfaceCategory>("Category", categorySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Category = (models.Category || categoryModel()) as ReturnType<
  typeof categoryModel
>;
