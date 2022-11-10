import { Schema, model, Types, models } from "mongoose";
/**
 * This is an interface representing a document for a donation in the database(MongoDB). 
 */
export interface Interface_Donation {
  userId: Types.ObjectId | string;
  orgId: Types.ObjectId | string;
  nameOfOrg: string;
  payPalId: string;
  nameOfUser: string;
  amount: number;
}
/**
 * This is the Structure of the Donation
 * @param userId - User-id
 * @param orgId - Organization-id
 * @param nameOfOrg - Name of the organization
 * @param payPalId - PayPalId
 * @param nameOfUser - Name of the user
 * @param amount - Amount of the donation
 */
const donationSchema = new Schema({
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
});

const DonationModel = () =>
  model<Interface_Donation>("Donation", donationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Donation = (models.Donation || DonationModel()) as ReturnType<
  typeof DonationModel
>;
