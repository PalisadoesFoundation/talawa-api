import type { Types, Model, PopulatedDoc, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceFund } from "./Fund";
import type { InterfaceCampaignPledge } from "./CampaignPledge";

/**
 * This is an interface representing a document for a Fund Campaign in the database(MongoDB).
 */

export interface InterfaceFundCampaign {
  _id: Types.ObjectId | string;
  name: string;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  goalAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  parentFund: PopulatedDoc<InterfaceFund & Document>;
  pledgeId: PopulatedDoc<InterfaceCampaignPledge & Document>;
}

/**
 * This describes the schema for a `FundCampaign` that corresponds to `InterfaceFundCampaign` document.
 * @param name - Name of the Fund Campaign.
 * @param creatorId - Fund Campaign creator, refer to `User` model.
 * @param goalAmount - Number which describes the amount of money.
 * @param currency - Tells about the currency of the country. Follows ISO-4217 currency codes.
 * @param startDate - Starting date of the fund campaign programme.
 * @param endDate - Ending date of the fund campaign programme.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of the data when modified.
 */

const fundCampaignSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    goalAmount: {
      type: Number,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentFund: {
      type: Schema.Types.ObjectId,
      ref: "Fund",
      // required: true,
    },
    pledgeId: {
      type: Schema.Types.ObjectId,
      ref: "CampaignPledge",
    },
  },
  {
    timestamps: true,
  }
);

const fundCampaignModel = (): Model<InterfaceFundCampaign> =>
  model<InterfaceFundCampaign>("FundCampaign", fundCampaignSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const FundCampaign = (models.FundCampaign ||
  fundCampaignModel()) as ReturnType<typeof fundCampaignModel>;
