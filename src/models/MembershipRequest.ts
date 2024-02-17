import type { Document, Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * This is an interface that represents a database(MongoDB) document for Membership Request.
 */
export interface InterfaceMembershipRequest {
  _id: Types.ObjectId;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  user: PopulatedDoc<InterfaceUser & Document> | undefined;
  status: string;
}
/**
 * This describes the schema for a `MembershipRequest` that corresponds to `InterfaceMembershipRequest` document.
 * @param organization - Organization data for which membership request is added.
 * @param user - User data who requested membership for an organization.
 * @param status - Status.
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

createLoggingMiddleware(membershipRequestSchema, "MembershipRequest");

const membershipRequestModel = (): Model<InterfaceMembershipRequest> =>
  model<InterfaceMembershipRequest>(
    "MembershipRequest",
    membershipRequestSchema,
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const MembershipRequest = (models.MembershipRequest ||
  membershipRequestModel()) as ReturnType<typeof membershipRequestModel>;
