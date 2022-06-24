import { Schema, Types, model, Model } from 'mongoose';

export interface IEventProject {
  title: string;
  description: string;
  createdAt?: Date;
  event: Types.ObjectId;
  creator: Types.ObjectId;
  tasks?: Array<Types.ObjectId>;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const eventProjectSchema = new Schema<
  IEventProject,
  Model<IEventProject>,
  IEventProject
>({
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
    default: () => new Date(Date.now()),
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
  tasks: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const EventProject = model<IEventProject>(
  'EventProject',
  eventProjectSchema
);
