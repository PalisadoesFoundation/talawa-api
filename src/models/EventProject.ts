import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for an event project in the database(MongoDB).
 */
export interface InterfaceEventProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  event: PopulatedDoc<InterfaceEvent & Document>;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This is the Structure of the event project
 * @param title - Title
 * @param description - description
 * @param createdAt - Created at Date
 * @param updatedAt - Updated At Date
 * @param event - Event
 * @param creatorId - Event creator, ref to `User` model
 * @param tasks - Tasks
 * @param status - Status
 */
const eventProjectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const eventProjectModel = (): Model<InterfaceEventProject> =>
  model<InterfaceEventProject>("EventProject", eventProjectSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventProject = (models.EventProject ||
  eventProjectModel()) as ReturnType<typeof eventProjectModel>;
