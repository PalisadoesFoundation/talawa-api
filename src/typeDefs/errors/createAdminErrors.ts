import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for errors related to creating an admin.
 */
export const createAdminErrors = gql`
  type OrganizationNotFoundError implements Error {
    message: String!
  }

  type UserNotFoundError implements Error {
    message: String!
  }

  type UserNotAuthorizedError implements Error {
    message: String!
  }

  type OrganizationMemberNotFoundError implements Error {
    message: String!
  }

  union CreateAdminError =
    | OrganizationNotFoundError
    | UserNotFoundError
    | UserNotAuthorizedError
    | OrganizationMemberNotFoundError
`;
