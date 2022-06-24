import { Schema, Types, model, Model } from 'mongoose';

export interface IMembershipRequest {
  organization: Types.ObjectId;
  user?: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const membershipRequestSchema = new Schema<
  IMembershipRequest,
  Model<IMembershipRequest>,
  IMembershipRequest
>({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

export const MembershipRequest = model<IMembershipRequest>(
  'MembershipRequest',
  membershipRequestSchema
);
