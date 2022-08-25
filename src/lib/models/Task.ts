import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import { Interface_Event } from './Event';
import { Interface_User } from './User';

export interface Interface_Task {
  title: string;
  description?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt: Date;
  deadline?: Date;
  event: PopulatedDoc<Interface_Event>;
  creator: PopulatedDoc<Interface_User>;
}

const taskSchema = new Schema<
  Interface_Task,
  Model<Interface_Task>,
  Interface_Task
>({
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
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
  deadline: {
    type: Date,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export const Task = model<Interface_Task>('Task', taskSchema);
