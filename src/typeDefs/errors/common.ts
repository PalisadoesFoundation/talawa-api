import { gql } from "graphql-tag";

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

  type UserNotFoundError implements Error {
    message: String!
    path: [String!]!
  }

  type OrganizationNotFoundError implements Error {
    message: String!
    path: [String!]!
  }
`;
