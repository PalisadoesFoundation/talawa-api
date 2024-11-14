import type { Document, Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * Represents a database document for Membership Request.
 */
export interface InterfaceMembershipRequest {
  _id: Types.ObjectId;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  user: PopulatedDoc<InterfaceUser & Document> | undefined;
  status: string;
}

/**
 * Mongoose schema definition for Membership Request documents.
 * @param organization - The ID of the organization for which membership is requested.
 * @param user - The ID of the user who requested membership.
 * @param status - The current status of the membership request.
 */
const membershipRequestSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "ACTIVE",
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
  },
});

// Adding logging middleware for Membership Request schema.
createLoggingMiddleware(membershipRequestSchema, "MembershipRequest");

/**
 * Mongoose model for Membership Request documents.
 */
const membershipRequestModel = (): Model<InterfaceMembershipRequest> =>
  model<InterfaceMembershipRequest>(
    "MembershipRequest",
    membershipRequestSchema,
  );

// Exporting the Membership Request model while preventing Mongoose OverwriteModelError during tests.
export const MembershipRequest = (models.MembershipRequest ||
  membershipRequestModel()) as ReturnType<typeof membershipRequestModel>;
