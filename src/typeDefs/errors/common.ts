import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for common error types.
 */
export const commonErrors = gql`
  interface Error {
    message: String!
  }

  interface FieldError {
    message: String!
    path: [String!]!
  }

  type UnauthenticatedError implements Error {
    message: String!
  }

  type UnauthorizedError implements Error {
    message: String!
  }

  type MaximumLengthError implements FieldError {
    message: String!
    path: [String!]!
  }

  type MinimumLengthError implements FieldError {
    message: String!
    path: [String!]!
    limit: Int!
  }

  type MaximumValueError implements FieldError {
    message: String!
    path: [String!]!
    limit: Int!
  }

  type MinimumValueError implements FieldError {
    message: String!
    path: [String!]!
  }
`;
