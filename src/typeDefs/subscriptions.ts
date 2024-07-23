import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const subscriptions = gql`
  type Subscription {
    directMessageChat: MessageChat
    messageSentToDirectChat(userId: ID!): DirectChatMessage
    messageSentToGroupChat(userId: ID!): GroupChatMessage
    onPluginUpdate: Plugin
  }
`;
