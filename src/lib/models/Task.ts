import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import { IEvent } from './Event';
import { IUser } from './User';

export interface ITask {
  title: string;
  description?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt?: Date;
  deadline?: Date;
  event: PopulatedDoc<IEvent>;
  creator: PopulatedDoc<IUser>;
}

const taskSchema = new Schema<ITask, Model<ITask>, ITask>({
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
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
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

export const Task = model<ITask>('Task', taskSchema);
