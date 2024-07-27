import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for errors related to creating a member.
 */

export const createMemberErrors = gql`
  type UserNotFoundError implements Error {
    message: String!
  }

  type OrganizationNotFoundError implements Error {
    message: String!
  }

  type MemberNotFoundError implements Error {
    message: String!
  }
  type UserNotAuthorizedAdminError implements Error {
    message: String!
  }
  type UserNotAuthorizedError implements Error {
    message: String!
  }

  union CreateMemberError =
    | UserNotFoundError
    | OrganizationNotFoundError
    | MemberNotFoundError
    | UserNotAuthorizedAdminError
    | UserNotAuthorizedError
`;
