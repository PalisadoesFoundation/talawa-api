import { gql } from "apollo-server-core";
/**
 * This file creates schemas for a message.
 * The object consists of the following details:
 * 1. Message id
 * 2. Sender details
 * 3. Receiver details
 * 4. Message
 * 5. Laguage Barrier conditions
 * 6. Created at date
 */
export const message = gql`
  type MessageChat {
    _id: ID!
    sender: User!
    receiver: User!
    message: String!
    languageBarrier: Boolean
    createdAt: String!
  }

  input MessageChatInput {
    message: String!
    receiver: ID!
  }
`;
