import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const subscriptions = gql`
  type Subscription {
    messageSentToChat(userId: ID!): ChatMessage
    onPluginUpdate: Plugin
  }
`;
