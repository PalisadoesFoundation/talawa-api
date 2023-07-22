import { gql } from "graphql-tag";

export const mutationErrrors = gql`
  union AcceptAdminError = CurrentUserNotFound | GivenUserNotFound

  interface UserNotFound {
    message: String!
    path: [String!]!
  }

  type CurrentUserNotFound implements UserNotFound {
    message: String!
    path: [String!]!
  }

  type GivenUserNotFound implements UserNotFound {
    message: String!
    path: [String!]!
  }
`;
