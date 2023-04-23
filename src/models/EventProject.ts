import type { Types, PopulatedDoc, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceTask } from "./Task";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for an event project in the database(MongoDB).
 */
export interface InterfaceEventProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  createdAt: Date;
  event: PopulatedDoc<InterfaceEvent & Document>;
  creator: PopulatedDoc<InterfaceUser & Document>;
  tasks: PopulatedDoc<InterfaceTask & Document>[];
  status: string;
}
/**
 * This is the Structure of the event project
 * @param title - Title
 * @param description - description
 * @param createdAt - Created at Date
 * @param event - Event
 * @param creator - Creator
 * @param tasks - Tasks
 * @param status - Status
 */
const eventProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

const eventProjectModel = () =>
  model<InterfaceEventProject>("EventProject", eventProjectSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventProject = (models.EventProject ||
  eventProjectModel()) as ReturnType<typeof eventProjectModel>;
