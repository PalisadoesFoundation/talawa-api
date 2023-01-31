import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";
import { Interface_User } from "./User";

export interface Interface_MembershipRequest {
  _id: Types.ObjectId;
  organization: PopulatedDoc<Interface_Organization & Document>;
  user: PopulatedDoc<Interface_User & Document> | undefined;
  status: string;
}

const membershipRequestSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    required: true,
    default: "ACTIVE",
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
  },
});

const MembershipRequestModel = () =>
  model<Interface_MembershipRequest>(
    "MembershipRequest",
    membershipRequestSchema
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const MembershipRequest = (models.MembershipRequest ||
  MembershipRequestModel()) as ReturnType<typeof MembershipRequestModel>;
