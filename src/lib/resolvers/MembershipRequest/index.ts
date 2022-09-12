import { MembershipRequestResolvers } from '../../../generated/graphQLTypescriptTypes';
import { organization } from './organization';
import { user } from './user';

export const MembershipRequest: MembershipRequestResolvers = {
  organization,
  user,
};
