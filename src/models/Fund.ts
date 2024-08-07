import type { Model, PopulatedDoc, Types } from "mongoose";

import { Schema, model, models } from "mongoose";
import type { InterfaceFundraisingCampaign } from "./FundraisingCampaign";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a fund in the database (MongoDB).
 * This interface defines the structure and types of data that a fund document will hold.
 */
export interface InterfaceFund {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  refrenceNumber: string;
  taxDeductible: boolean;
  isDefault: boolean;
  isArchived: boolean;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  campaigns: PopulatedDoc<InterfaceFundraisingCampaign & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a fund document.
 * This schema defines how the data will be stored in the MongoDB database.
 * @param organizationId - Organization ID to which the fund belongs.
 * @param name - Name of the fund.
 * @param refrenceNumber - Reference number of the fund.
 * @param taxDeductible - Indicates whether the fund is tax deductible.
 * @param isDefault - Indicates whether the fund is the default fund.
 * @param isArchived - Indicates whether the fund is archived.
 * @param creatorId - Reference to the user who created the fund (refers to the `User` model).
 * @param campaigns - Campaigns associated with the fund.
 * @param createdAt - Timestamp of when the fund document was created.
 * @param updatedAt - Timestamp of when the fund document was last updated.
 **/
const fundSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    refrenceNumber: {
      type: String,
    },
    taxDeductible: {
      type: Boolean,
      required: true,
    },
    isDefault: {
      type: Boolean,
      required: true,
    },
    isArchived: {
      type: Boolean,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "FundraisingCampaign",
      },
    ],
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

/**
 * Creates a Mongoose model for the fund schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The Fund model.
 */
const fundModel = (): Model<InterfaceFund> =>
  model<InterfaceFund>("Fund", fundSchema);

/**
 * Export the Fund model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const Fund = (models.Fund || fundModel()) as ReturnType<
  typeof fundModel
>;
