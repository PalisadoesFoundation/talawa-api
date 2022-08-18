import { Schema, model, Model, PopulatedDoc } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import validator from 'validator';
import { Interface_Event } from './Event';
import { Interface_MembershipRequest } from './MembershipRequest';
import { Interface_Organization } from './Organization';

export interface Interface_User {
  image?: string;
  tokenVersion?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  appLanguageCode: string;
  createdOrganizations: Array<PopulatedDoc<Interface_Organization>>;
  createdEvents: Array<PopulatedDoc<Interface_Event>>;
  userType: 'USER' | 'ADMIN' | 'SUPERADMIN';
  joinedOrganizations: Array<PopulatedDoc<Interface_Organization>>;
  registeredEvents: Array<PopulatedDoc<Interface_Event>>;
  eventAdmin: Array<PopulatedDoc<Interface_Event>>;
  adminFor: Array<PopulatedDoc<Interface_Organization>>;
  membershipRequests: Array<PopulatedDoc<Interface_MembershipRequest>>;
  organizationsBlockedBy: Array<PopulatedDoc<Interface_Organization>>;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  organizationUserBelongsTo?: PopulatedDoc<Interface_Organization>;
  pluginCreationAllowed: boolean;
}

const userSchema = new Schema<
  Interface_User,
  Model<Interface_User>,
  Interface_User
>({
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
Invalid code. Currently ignored by typescript. Needs fix.
This library mongoose-paginate-v2 has wrong typescript bindings.
@ts-ignore cannot be removed until the author of library fixes it.
*/
// @ts-ignore
userSchema.plugin(mongoosePaginate);

export const User = model<Interface_User>('User', userSchema);
