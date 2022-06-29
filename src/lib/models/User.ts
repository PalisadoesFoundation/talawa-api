import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import validator from 'validator';
import { IEvent } from './Event';
import { IMembershipRequest } from './MembershipRequest';
import { IOrganization } from './Organization';

export interface IUser {
  image?: string;
  tokenVersion?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  appLanguageCode: string;
  createdOrganizations: Array<PopulatedDoc<IOrganization>>;
  createdEvents: Array<PopulatedDoc<IEvent>>;
  userType: 'USER' | 'ADMIN' | 'SUPERADMIN';
  joinedOrganizations: Array<PopulatedDoc<IOrganization>>;
  registeredEvents: Array<PopulatedDoc<IEvent>>;
  eventAdmin: Array<PopulatedDoc<IEvent>>;
  adminFor: Array<PopulatedDoc<IOrganization>>;
  membershipRequests: Array<PopulatedDoc<IMembershipRequest>>;
  organizationsBlockedBy: Array<PopulatedDoc<IOrganization>>;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  organizationUserBelongsTo?: PopulatedDoc<IOrganization>;
  pluginCreationAllowed: boolean;
}

const userSchema = new Schema<IUser, Model<IUser>, IUser>({
  image: {
    type: String,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, 'invalid email'],
  },
  password: {
    type: String,
    required: true,
  },
  appLanguageCode: {
    type: String,
    required: true,
    default: 'en',
  },
  createdOrganizations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  createdEvents: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  userType: {
    type: String,
    required: true,
    enum: ['USER', 'ADMIN', 'SUPERADMIN'],
    default: 'USER',
  },
  joinedOrganizations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  registeredEvents: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  eventAdmin: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  adminFor: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  membershipRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'MembershipRequest',
    },
  ],
  organizationsBlockedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  organizationUserBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
  pluginCreationAllowed: {
    type: Boolean,
    required: true,
    default: true,
  },
});

/*
This library mongoose-paginate-v2 has incompatible typescript bindings.
@ts-ignore comment cannot be removed until the author of library fixes it.
*/
// @ts-ignore
userSchema.plugin(mongoosePaginate);

export const User = model<IUser>('User', userSchema);
