import type { Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import {
  CurrencyType,
  type InterfaceFundraisingCampaign,
} from "./FundraisingCampaign";
import { type InterfaceUser } from "./User";

/**
 * Interface representing a document for a fundraising campaign pledge in the database (MongoDB).
 */
export interface InterfaceFundraisingCampaignPledges {
  _id: Types.ObjectId;
  campaign: PopulatedDoc<InterfaceFundraisingCampaign & Document>;
  users: PopulatedDoc<InterfaceUser & Document>[];
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: CurrencyType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for a fundraising campaign pledge.
 * Defines the structure of the pledge document stored in MongoDB.
 * @param campaign - The fundraising campaign associated with the pledge.
 * @param users - The users who made the pledge.
 * @param startDate - The start date of the pledge.
 * @param endDate - The end date of the pledge.
 * @param amount - The amount pledged.
 * @param currency - The currency type of the amount pledged.
 * @param createdAt - The date and time when the pledge was created.
 * @param updatedAt - The date and time when the pledge was last updated.
 */
const fundraisingCampaignPledgeSchema = new Schema(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "FundraisingCampaign",
      required: true,
    },
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
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

/**
 * Function to retrieve or create the Mongoose model for the FundraisingCampaignPledge.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the FundraisingCampaignPledge.
 */
const fundraisingCampaignPledgeModel =
  (): Model<InterfaceFundraisingCampaignPledges> =>
    model<InterfaceFundraisingCampaignPledges>(
      "FundraisingCampaignPledge",
      fundraisingCampaignPledgeSchema,
    );

/**
 * The Mongoose model for the FundraisingCampaignPledge.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const FundraisingCampaignPledge = (models.FundraisingCampaignPledge ||
  fundraisingCampaignPledgeModel()) as ReturnType<
  typeof fundraisingCampaignPledgeModel
>;
