import { GroupChatResolvers } from '../../../generated/graphQLTypescriptTypes';
import { creator } from './creator';
import { messages } from './messages';
import { organization } from './organization';
import { users } from './users';

export const GroupChat: GroupChatResolvers = {
  creator,
  messages,
  organization,
  users,
};
