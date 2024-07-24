import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for a donation in MongoDB.
 */
export interface InterfaceDonation {
  userId: Types.ObjectId | string;
  orgId: Types.ObjectId | string;
  nameOfOrg: string;
  payPalId: string;
  nameOfUser: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for a donation.
 * @param userId - ID of the user making the donation.
 * @param orgId - ID of the organization receiving the donation.
 * @param nameOfOrg - Name of the organization.
 * @param payPalId - PayPal ID used for the donation.
 * @param nameOfUser - Name of the user making the donation.
 * @param amount - Amount of the donation.
 * @param createdAt - Timestamp of donation creation.
 * @param updatedAt - Timestamp of donation update.
 */
const donationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    nameOfOrg: {
      type: String,
      required: true,
    },
    payPalId: {
      type: String,
      required: true,
    },
    nameOfUser: {
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
  },
);

// Add logging middleware for donationSchema
createLoggingMiddleware(donationSchema, "Donation");

/**
 * Retrieves or creates the Mongoose model for Donation.
 */
const donationModel = (): Model<InterfaceDonation> =>
  model<InterfaceDonation>("Donation", donationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Donation = (models.Donation || donationModel()) as ReturnType<
  typeof donationModel
>;
