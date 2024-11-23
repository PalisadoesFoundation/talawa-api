import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceEventVolunteer } from "./EventVolunteer";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceUser } from "./User";

/**
 * Represents a document for a volunteer membership in the MongoDB database.
 * This interface defines the structure and types of data that a volunteer membership document will hold.
 */
export interface InterfaceVolunteerMembership {
  _id: Types.ObjectId;
  volunteer: PopulatedDoc<InterfaceEventVolunteer & Document>;
  group: PopulatedDoc<InterfaceEventVolunteerGroup & Document>;
  event: PopulatedDoc<InterfaceEvent & Document>;
  status: "invited" | "requested" | "accepted" | "rejected";
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a volunteer group membership document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param volunteer - Reference to the event volunteer involved in the group membership.
 * @param group - Reference to the event volunteer group. Absence denotes a request for individual volunteer request.
 * @param event - Reference to the event that the group is part of.
 * @param status - Current status of the membership (invited, requested, accepted, rejected).
 * @param createdBy - Reference to the user who created the group membership document.
 * @param updatedBy - Reference to the user who last updated the group membership document.
 * @param createdAt - Timestamp of when the group membership document was created.
 * @param updatedAt - Timestamp of when the group membership document was last updated.
 */
const volunteerMembershipSchema = new Schema(
  {
    volunteer: {
      type: Schema.Types.ObjectId,
      ref: "EventVolunteer",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "EventVolunteerGroup",
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["invited", "requested", "accepted", "rejected"],
      required: true,
      default: "invited",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

// Enable logging on changes in VolunteerMembership collection
createLoggingMiddleware(volunteerMembershipSchema, "VolunteerMembership");

/**
 * Creates a Mongoose model for the volunteer group membership schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The VolunteerMembership model.
 */
const volunteerMembershipModel = (): Model<InterfaceVolunteerMembership> =>
  model<InterfaceVolunteerMembership>(
    "VolunteerMembership",
    volunteerMembershipSchema,
  );

/**
 * Export the VolunteerMembership model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const VolunteerMembership = (models.VolunteerMembership ||
  volunteerMembershipModel()) as ReturnType<typeof volunteerMembershipModel>;
