import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import { Interface_User } from './User';

export interface Interface_Comment {
  text: string;
  createdAt: Date;
  creator: PopulatedDoc<Interface_User>;
  post: PopulatedDoc<Interface_User>;
  likedBy: Array<PopulatedDoc<Interface_User>>;
  likeCount: number;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const commentSchema = new Schema<
  Interface_Comment,
  Model<Interface_Comment>,
  Interface_Comment
>({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const Comment = model<Interface_Comment>('Comment', commentSchema);
