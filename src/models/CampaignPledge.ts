import type { Types, Model, PopulatedDoc, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceFundCampaign } from "./FundCampaign";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for a Campaign Pledge in the database(MongoDB).
 */

export interface InterfaceCampaignPledge {
  _id: Types.ObjectId | string;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  members: PopulatedDoc<InterfaceUser & Document>[];
  campaigns: PopulatedDoc<InterfaceFundCampaign & Document>[];
  startDate: Date;
  amount: number;
  currency: string;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `Fund` that corresponds to `InterfaceFundCampaign` document.
 * @param creatorId - Fund creator, refer to `User` model.
 * @param members - Users who have signed the pledge
 * @param campaigns - array of the all the fund campaigns ids under the pledge.
 * @param startDate - Starting date of the fund campaign programme.
 * @param endDate - Ending date of the fund campaign programme.
 * @param amount - Number which describes the amount of money.
 * @param currency - Tells about the currency of the country. Follows ISO-4217 currency codes.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of the data when modified.
 */

const campaignPledgeSchema = new Schema(
  {
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
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    amount: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

const campaignPledgeModel = (): Model<InterfaceCampaignPledge> =>
  model<InterfaceCampaignPledge>("CampaignPledge", campaignPledgeSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const CampaignPledge = (models.CampaignPledge ||
  campaignPledgeModel()) as ReturnType<typeof campaignPledgeModel>;
