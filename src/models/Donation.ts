import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * This is an interface representing a document for a donation in the database(MongoDB).
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
 * This is the Structure of the Donation
 * @param userId - User-id
 * @param orgId - Organization-id
 * @param nameOfOrg - Name of the organization
 * @param payPalId - PayPalId
 * @param nameOfUser - Name of the user
 * @param amount - Amount of the donation
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
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

createLoggingMiddleware(donationSchema, "Donation");

const donationModel = (): Model<InterfaceDonation> =>
  model<InterfaceDonation>("Donation", donationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Donation = (models.Donation || donationModel()) as ReturnType<
  typeof donationModel
>;
