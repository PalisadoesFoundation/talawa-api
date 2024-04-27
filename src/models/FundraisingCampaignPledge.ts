import type { Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import {
  CurrencyType,
  type InterfaceFundraisingCampaign,
} from "./FundraisingCampaign";
import { type InterfaceUser } from "./User";

export interface InterfaceFundraisingCampaignPledges {
  _id: Types.ObjectId;
  campaigns: PopulatedDoc<InterfaceFundraisingCampaign & Document>[];
  users: PopulatedDoc<InterfaceUser & Document>[];
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: CurrencyType;
  createdAt: Date;
  updatedAt: Date;
}
const fundraisingCampaignPledgeSchema = new Schema(
  {
    campaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "FundraisingCampaign",
        required: true,
      },
    ],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: Object.values(CurrencyType),
    },
  },
  {
    timestamps: true,
  },
);
const fundraisingCampaignPledgeModel =
  (): Model<InterfaceFundraisingCampaignPledges> =>
    model<InterfaceFundraisingCampaignPledges>(
      "FundraisingCampaignPledge",
      fundraisingCampaignPledgeSchema,
    );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const FundraisingCampaignPledge = (models.FundraisingCampaignPledge ||
  fundraisingCampaignPledgeModel()) as ReturnType<
  typeof fundraisingCampaignPledgeModel
>;
