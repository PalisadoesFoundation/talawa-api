import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceTask } from "./Task";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for an event in the database(MongoDB).
 */
export interface InterfaceTaskVolunteer {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  taskId: PopulatedDoc<InterfaceTask & Document>;
}

/**
 * This is the Structure of the Task Volunteer
 * @param userId - The user who was assgined the task
 * @param taskId - The task which was assigned
 */

const taskVolunteerSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
});

taskVolunteerSchema.index({ userId: 1, taskId: 1 }, { unique: true });

const taskVolunteerModel = (): Model<InterfaceTaskVolunteer> =>
  model<InterfaceTaskVolunteer>("TaskVolunteer", taskVolunteerSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TaskVolunteer = (models.TaskVolunteer ||
  taskVolunteerModel()) as ReturnType<typeof taskVolunteerModel>;
