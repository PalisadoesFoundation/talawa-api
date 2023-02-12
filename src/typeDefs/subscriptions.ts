import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const subscriptions = gql`
  type Subscription {
    directMessageChat: MessageChat
    messageSentToDirectChat: DirectChatMessage
    messageSentToGroupChat: GroupChatMessage
  }
`;
