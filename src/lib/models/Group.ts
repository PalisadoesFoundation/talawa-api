import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_Group {
  title: string;
  description?: string;
  createdAt: Date;
  organization: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  admins: Array<Types.ObjectId>;
}

const groupSchema = new Schema<
  Interface_Group,
  Model<Interface_Group>,
  Interface_Group
>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
});

export const Group = model<Interface_Group>('Group', groupSchema);
