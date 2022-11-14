import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Event } from "./Event";
import { Interface_User } from "./User";

/**
 * This is an interface that represents a database(MongoDB) document for Task.
 */
export interface Interface_Task {
  _id: Types.ObjectId;
  title: string;
  description: string | undefined;
  status: string;
  createdAt: Date;
  deadline: Date | undefined;
  event: PopulatedDoc<Interface_Event & Document>;
  creator: PopulatedDoc<Interface_User & Document>;
}

/**
 * This describes the schema for a `Task` that corresponds to `Interface_Task` document.
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

// creates a model.
const TaskModel = () => model<Interface_Task>("Task", taskSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Task = (models.Task || TaskModel()) as ReturnType<
  typeof TaskModel
>;
