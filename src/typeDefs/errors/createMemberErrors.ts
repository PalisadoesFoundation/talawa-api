import { gql } from "graphql-tag";

export const createMemberErrors = gql`
  type UserNotFoundError implements Error {
    message: String!
  }

  type OrganizationNotFoundError implements Error {
    message: String!
  }

  type MemberAlreadyInOrganizationError implements Error {
    message: String!
  }

  union CreateMemberError =
    | UserNotFoundError
    | OrganizationNotFoundError
    | MemberAlreadyInOrganizationError
`;
