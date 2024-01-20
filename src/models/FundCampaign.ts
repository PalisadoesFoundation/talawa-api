import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for a Fund Campaign in the database(MongoDB).
 */

export interface InterfaceFundCampaign {
  _id: Types.ObjectId;
  name: string;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  goalAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
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
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const FundCampaignModel = (): Model<InterfaceFundCampaign> =>
  model<InterfaceFundCampaign>("FundCampaign", fundCampaignSchema);

export const FundCampaign = (models.FundCampaign ||
  FundCampaignModel()) as ReturnType<typeof FundCampaignModel>;
