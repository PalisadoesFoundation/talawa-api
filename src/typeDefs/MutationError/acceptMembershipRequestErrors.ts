import { gql } from "graphql-tag";

export const acceptMembershipRequestErrors = gql`
  union AcceptMembershipRequestErrors =
      MembershipRequestNotFoundError
    | OrganizationNotFoundError
    | UserNotFoundError
    | UserAlreadyMemberError

  type MembershipRequestNotFoundError implements Error {
    message: String!
    path: [String!]!
  }

  type UserAlreadyMemberError implements Error {
    message: String!
    path: [String!]!
  }
`;
