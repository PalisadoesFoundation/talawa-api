import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { Interface_Event } from "./Event";
import { Interface_Task } from "./Task";
import { Interface_User } from "./User";

export interface Interface_EventProject {
  _id: Types.ObjectId;
  title: string;
  description: string;
  createdAt: Date;
  event: PopulatedDoc<Interface_Event & Document>;
  creator: PopulatedDoc<Interface_User & Document>;
  tasks: Array<PopulatedDoc<Interface_Task & Document>>;
  status: string;
}

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

const EventProjectModel = () =>
  model<Interface_EventProject>("EventProject", eventProjectSchema);

export const EventProject = (models.EventProject ||
  EventProjectModel()) as ReturnType<typeof EventProjectModel>;
