import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { Interface_Comment } from './Comment';
import { Interface_Organization } from './Organization';
import { Interface_User } from './User';

export interface Interface_Post {
  text: string;
  title?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt?: Date;
  imageUrl?: string;
  videoUrl?: string;
  creator: PopulatedDoc<Interface_User>;
  organization: PopulatedDoc<Interface_Organization>;
  likedBy: Array<PopulatedDoc<Interface_User>>;
  comments: Array<PopulatedDoc<Interface_Comment>>;
  likeCount?: number;
  commentCount?: number;
}

const postSchema = new Schema<
  Interface_Post,
  Model<Interface_Post>,
  Interface_Post
>({
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
Invalid code. Currently ignored by typescript. Needs fix.
This library mongoose-paginate-v2 has wrong typescript bindings.
@ts-ignore cannot be removed until the author of library fixes it. 
*/
// @ts-ignore
postSchema.plugin(mongoosePaginate);

export const Post = model<Interface_Post>('Post', postSchema);
