import { Schema, model, Types, models } from "mongoose";

export interface Interface_Donation {
  userId: Types.ObjectId | string;
  orgId: Types.ObjectId | string;
  nameOfOrg: string;
  payPalId: string;
  nameOfUser: string;
  amount: number;
}

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

export const Donation = (models.Donation || DonationModel()) as ReturnType<
  typeof DonationModel
>;
