import { gql } from "graphql-tag";
export const createDirectChatErrors = gql`
  type OrganizationNotFoundError implements Error {
    message: String!
  }

  type UserNotFoundError implements Error {
    message: String!
  }

  union CreateDirectChatError = OrganizationNotFoundError | UserNotFoundError
`;
