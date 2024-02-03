import { gql } from "graphql-tag";

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
      OrganizationNotFoundError
    | UserNotFoundError
    | UserNotAuthorizedError
    | OrganizationMemberNotFoundError
`;
