import { Schema, Types, model, Model, Document, PopulatedDoc } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { IComment } from './Comment';
import { IOrganization } from './Organization';
import { IUser } from './User';

export interface IPost {
  text: string;
  title?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt?: Date;
  imageUrl?: string;
  videoUrl?: string;
  creator: PopulatedDoc<IUser>;
  organization: PopulatedDoc<IOrganization>;
  likedBy: Array<PopulatedDoc<IUser>>;
  comments: Array<PopulatedDoc<IComment>>;
  likeCount?: number;
  commentCount?: number;
}

const postSchema = new Schema<IPost, Model<IPost>, IPost>({
  text: {
    type: String,
    required: true,
  },
  title: {
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
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
});

/*
This library mongoose-paginate-v2 has wrong typescript bindings.
@ts-ignore comment cannot be removed until the author of library fixes it. 
*/
// @ts-ignore
postSchema.plugin(mongoosePaginate);

export const Post = model<IPost>('Post', postSchema);
