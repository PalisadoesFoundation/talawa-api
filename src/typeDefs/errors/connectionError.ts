import { gql } from "apollo-server-core";

export const connectionError = gql`
  union ConnectionError =
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
