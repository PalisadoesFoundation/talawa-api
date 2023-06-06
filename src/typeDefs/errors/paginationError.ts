import { gql } from "apollo-server-core";

export const paginationError = gql`
  union PaginationError =
      MissingArguments
    | IncorrectPairingOfArguments
    | IncorrectCursor
    | MaximumValueError

  type MissingArguments implements FieldError {
    message: String!
    path: [String!]!
  }

  type IncorrectPairingOfArguments implements FieldError {
    message: String!
    path: [String!]!
  }

  type IncorrectCursor implements FieldError {
    message: String!
    path: [String!]!
  }
`;
