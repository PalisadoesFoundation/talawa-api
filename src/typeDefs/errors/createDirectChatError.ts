import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for errors related to creating a direct chat.
 */
export const createDirectChatErrors = gql`
  type OrganizationNotFoundError implements Error {
    message: String!
  }

  type UserNotFoundError implements Error {
    message: String!
  }

  union CreateDirectChatError = OrganizationNotFoundError | UserNotFoundError
`;
