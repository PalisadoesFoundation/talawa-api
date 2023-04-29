import { gql } from "apollo-server-core";

export const paginationError = gql`
  union PaginationError =
      MissingArguments
    | IncorrectPairingOfArguments
    | FetchLimitExceeded
    | IncorrectCursor

  interface PaginationArgsError {
    message: String!
    path: [String!]!
  }

  type MissingArguments implements PaginationArgsError {
    message: String!
    path: [String!]!
  }

  type IncorrectPairingOfArguments implements PaginationArgsError {
    message: String!
    path: [String!]!
  }

  type FetchLimitExceeded implements PaginationArgsError {
    message: String!
    path: [String!]!
    limit: Int!
  }

  type IncorrectCursor implements PaginationArgsError {
    message: String!
    path: [String!]!
  }
`;
