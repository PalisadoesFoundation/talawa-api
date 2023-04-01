import { gql } from "apollo-server-core";

export const paginationErrors = gql`
  union PaginationError =
      PaginationArgsError
    | MissingArguments
    | IncorrectPairingOfArguments
    | FetchLimitExceeded

  interface PaginationArgsError {
    message: String!
    path: String!
  }

  type MissingArguments implements PaginationArgsError {
    message: String!
    path: String!
  }

  type IncorrectPairingOfArguments implements PaginationArgsError {
    message: String!
    path: String!
  }

  type FetchLimitExceeded implements PaginationArgsError {
    message: String!
    path: String!
    limit: Int!
  }
`;
