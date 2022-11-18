import { gql } from "apollo-server-core";
/**
 * This graphql typedef defines the schema-definition and contains 
 * the query logic to interact with various types of chats.
 */
export const chat = gql`
  type DirectChat {
    _id: ID!
    users: [User!]!
    messages: [DirectChatMessage]
    creator: User!
    organization: Organization!
  }

  type GroupChat {
    _id: ID!
    users: [User!]!
    messages: [GroupChatMessage]
    creator: User!
    organization: Organization!
  }

  type GroupChatMessage {
    _id: ID!
    groupChatMessageBelongsTo: GroupChat!
    sender: User!
    createdAt: String!
    messageContent: String!
  }

  type DirectChatMessage {
    _id: ID!
    directChatMessageBelongsTo: DirectChat!
    sender: User!
    receiver: User!
    createdAt: String!
    messageContent: String!
  }

  input createChatInput {
    userIds: [ID!]!
    organizationId: ID!
  }

  input createGroupChatInput {
    userIds: [ID!]!
    organizationId: ID!
    title: String!
  }
`;
