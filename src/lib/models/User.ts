import {
  Schema,
  model,
  PopulatedDoc,
  PaginateModel,
  Types,
  Document,
} from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import validator from 'validator';
import { Interface_Event } from './Event';
import { Interface_MembershipRequest } from './MembershipRequest';
import { Interface_Organization } from './Organization';

export interface Interface_User {
  _id: Types.ObjectId;
  image: string | undefined;
  token: string | undefined;
  tokenVersion: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  appLanguageCode: string;
  createdOrganizations: Array<PopulatedDoc<Interface_Organization & Document>>;
  createdEvents: Array<PopulatedDoc<Interface_Event & Document>>;
  userType: string;
  joinedOrganizations: Array<PopulatedDoc<Interface_Organization & Document>>;
  registeredEvents: Array<PopulatedDoc<Interface_Event & Document>>;
  eventAdmin: Array<PopulatedDoc<Interface_Event & Document>>;
  adminFor: Array<PopulatedDoc<Interface_Organization & Document>>;
  membershipRequests: Array<
    PopulatedDoc<Interface_MembershipRequest & Document>
  >;
  organizationsBlockedBy: Array<
    PopulatedDoc<Interface_Organization & Document>
  >;
  status: string;
  organizationUserBelongsTo:
    | PopulatedDoc<Interface_Organization & Document>
    | undefined;
  pluginCreationAllowed: boolean;
  adminApproved: boolean;
  createdAt: Date;
}

const userSchema = new Schema({
  image: {
    type: String,
  },
  token: {
    type: String,
    required: false,
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
  adminApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(mongoosePaginate);

export const User = model<Interface_User, PaginateModel<Interface_User>>(
  'User',
  userSchema
);
