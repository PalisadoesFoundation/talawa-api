import { Schema, Types, model, Model, PopulatedDoc, Document } from 'mongoose';
import { IUser } from './User';

export interface IComment {
  text: string;
  createdAt?: Date;
  creator: PopulatedDoc<IUser>;
  post: PopulatedDoc<IUser>;
  likedBy: Array<PopulatedDoc<IUser>>;
  likeCount?: number;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const commentSchema = new Schema<IComment, Model<IComment>, IComment>({
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

export const Comment = model<IComment>('Comment', commentSchema);
