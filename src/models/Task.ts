import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEventProject } from "./EventProject";

/**
 * This is an interface that represents a database(MongoDB) document for Task.
 */

export interface InterfaceTask {
  _id: Types.ObjectId;
  completed: boolean;
  createdAt: Date;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  deadline: Date | undefined;
  description: string | undefined;
  eventProjectId: PopulatedDoc<InterfaceEventProject & Document>;
  status: string;
  title: string;
  updatedAt: Date;
}

/**
 * This describes the schema for a `Task` that corresponds to `InterfaceTask` document.
 * @param completed - Has the task been completed
 * @param createdAt - Time stamp of data creation.
 * @param createdBy - Task creator, refer to `User` model.
 * @param deadline - Task deadline.
 * @param description - Task description.
 * @param eventProjectId - Event Project object for which task is added.
 * @param status - Status.
 * @param title - Task title.
 * @param updatedAt - Time stamp of data updation.
 */

const taskSchema = new Schema(
  {
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
    deadline: {
      type: Date,
    },
    eventProjectId: {
      type: Schema.Types.ObjectId,
      ref: "EventProject",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    completed: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const taskModel = (): Model<InterfaceTask> =>
  model<InterfaceTask>("Task", taskSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Task = (models.Task || taskModel()) as ReturnType<
  typeof taskModel
>;
