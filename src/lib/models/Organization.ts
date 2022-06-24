import { Schema, Types, model, Model, PaginateModel } from 'mongoose';

export interface IOrganization {
  apiUrl?: string;
  image?: string;
  name: string;
  description: string;
  location?: string;
  isPublic: boolean;
  creator: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  members: Array<Types.ObjectId>;
  admins: Array<Types.ObjectId>;
  groupChats: Array<Types.ObjectId>;
  posts: Array<Types.ObjectId>;
  membershipRequests: Array<Types.ObjectId>;
  blockedUsers: Array<Types.ObjectId>;
  visibleInSearch?: boolean;
  createdAt?: Date;
}

const organizationSchema = new Schema<
  IOrganization,
  Model<IOrganization>,
  IOrganization
>({
  apiUrl: {
    type: String,
  },
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  groupChats: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  ],
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  membershipRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'MembershipRequest',
    },
  ],
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  visibleInSearch: Boolean,
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
});

export const Organization = model<IOrganization>(
  'Organization',
  organizationSchema
);
