import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEventProject } from "./EventProject";

/**
 * This is an interface that represents a database(MongoDB) document for Task.
 */

export interface InterfaceTask {
  _id: Types.ObjectId;
  title: string;
  description: string | undefined;
  status: string;
  createdAt: Date;
  deadline: Date | undefined;
  eventProjectId: PopulatedDoc<InterfaceEventProject & Document>;
  creator: PopulatedDoc<InterfaceUser & Document>;
  completed: boolean;
}

/**
 * This describes the schema for a `Task` that corresponds to `InterfaceTask` document.
 * @param title - Task title.
 * @param description - Task description.
 * @param status - Status.
 * @param createdAt - Time stamp of data creation.
 * @param deadline - Task deadline.
 * @param eventProjectId - Event Project object for which task is added.
 * @param creator - Task creator, refer to `User` model.
 * @param completed - Has the task been completed
 */

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
  },
  eventProjectId: {
    type: Schema.Types.ObjectId,
    ref: "EventProject",
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const taskModel = (): Model<InterfaceTask> =>
  model<InterfaceTask>("Task", taskSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Task = (models.Task || taskModel()) as ReturnType<
  typeof taskModel
>;
