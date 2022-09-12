import { withFilter } from 'apollo-server-express';
import { SubscriptionResolvers } from '../../../generated/graphQLTypescriptTypes';

const CHAT_CHANNEL = 'CHAT_CHANNEL';

export const directMessageChat: SubscriptionResolvers['directMessageChat'] = {
  // @ts-ignore
  subscribe: withFilter(
    (_parent, _args, context) => context.pubsub.asyncIterator(CHAT_CHANNEL),

    (payload) => {
      return payload.directMessageChat;
    }
  ),
};
