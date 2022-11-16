import { gql } from "apollo-server-core";
/**
 * This file creates schemas for different types of chats.
 * The chats and subparts of the chats covered are:
 * 1. Direct chat
 * 2. Group chat
 * 3. Group chat message
 * 4. Direct chat message
 * 5. Direct chat input
 * 6. Group chat input
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
