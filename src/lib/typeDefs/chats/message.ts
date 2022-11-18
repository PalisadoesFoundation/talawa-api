import { gql } from "apollo-server-core";

/**
 * This graphql typedef defines the schema-definition and contains 
 * the query logic to interact with a message.
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
