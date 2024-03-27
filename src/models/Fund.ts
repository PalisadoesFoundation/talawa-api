import type { Model, PopulatedDoc, Types } from "mongoose";

import { Schema, model, models } from "mongoose";
import type { InterfaceFundraisingCampaign } from "./FundraisingCampaign";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for fund in the database(MongoDB).
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
 * This is the structure of a file
 * @param organizationId - Organization ID to which the fund belongs
 * @param name - Name of the fund
 * @param refrenceNumber - Reference number of the fund
 * @param taxDeductible - Whether the fund is tax deductible
 * @param isDefault - Whether the fund is default
 * @param isArchived - Whether the fund is archived
 * @param campaign - Campaigns associated with the fund
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
 * @param creatorId - User who created the fund, refer to `User` model.
 *
 */
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
        ref: "FundCampaign",
      },
    ],
  },
  {
    timestamps: true,
  },
);
const fundModel = (): Model<InterfaceFund> =>
  model<InterfaceFund>("Fund", fundSchema);
// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Fund = (models.Fund || fundModel()) as ReturnType<
  typeof fundModel
>;
