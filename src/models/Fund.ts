import type { Types, Model, PopulatedDoc, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceFundCampaign } from "./FundCampaign";

/**
 * This is an interface representing a document for a Fund in the database(MongoDB).
 */

export interface InterfaceFund {
  _id: Types.ObjectId | string;
  name: string;
  creatorId: Types.ObjectId | string;
  organizationId: Types.ObjectId | string;
  taxDeductible: boolean;
  defaultFund: boolean;
  archived: boolean;
  campaigns: PopulatedDoc<InterfaceFundCampaign & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `Fund` that corresponds to `InterfaceFundCampaign` document.
 * @param name - Name of the Fund.
 * @param creatorId - Fund creator, refer to `User` model.
 * @param organizationId - Id of the organization to which fund belongs.
 * @param taxDeductible - whether the funds are tax deductible or not.
 * @param defaultFund - whether the fund is default fund or not.
 * @param archived - whether the fund is archived.
 * @param campaigns - array of the all the fund campaigns ids under the fund.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of the data when modified.
 */

const fundSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    taxDeductible: {
      type: Boolean,
      required: true,
    },
    defaultFund: {
      type: Boolean,
      required: true,
    },
    archived: {
      type: Boolean,
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
  }
);

const fundModel = (): Model<InterfaceFund> =>
  model<InterfaceFund>("Fund", fundSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Fund = (models.Fund || fundModel()) as ReturnType<
  typeof fundModel
>;
