import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Event } from "./Event";
import { Interface_User } from "./User";

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

const TaskModel = () => model<Interface_Task>("Task", taskSchema);

export const Task = (models.Task || TaskModel()) as ReturnType<
  typeof TaskModel
>;
