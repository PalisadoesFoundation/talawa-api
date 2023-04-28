import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import type { InterfaceUser } from "./User";
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
  event: PopulatedDoc<InterfaceEvent & Document>;
  creator: PopulatedDoc<InterfaceUser & Document>;
}
/**
 * This describes the schema for a `Task` that corresponds to `InterfaceTask` document.
 * @param title - Task title.
 * @param description - Task description.
 * @param status - Status.
 * @param createdAt - Time stamp of data creation.
 * @param deadline - Task deadline.
 * @param event - Event object for which task is added, refer to `Event` model.
 * @param creator - Task creator, refer to `User` model.
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
});

const taskModel = (): Model<InterfaceTask> =>
  model<InterfaceTask>("Task", taskSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Task = (models.Task || taskModel()) as ReturnType<
  typeof taskModel
>;
