import { gql } from 'apollo-server-core';

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
