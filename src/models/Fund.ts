import type { Model, PopulatedDoc, Types } from "mongoose";

import { Schema, model, models } from "mongoose";
import type { InterfaceFundCampaign } from "./FundCampaign";
/**
 * This is an interface representing a document for direct chat in the database(MongoDB).
 */
export interface InterfaceFund {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  refrenceNumber: string;
  taxDeductible: boolean;
  isDefault: boolean;
  isArchived: boolean;
  campaign: PopulatedDoc<InterfaceFundCampaign & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

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
      required: true,
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
    campaign: [
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
