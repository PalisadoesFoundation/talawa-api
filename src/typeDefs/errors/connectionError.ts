import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for connection-related errors.
 */
export const connectionError = gql`
  union ConnectionError = InvalidCursor | MaximumValueError

  type InvalidCursor implements FieldError {
    message: String!
    path: [String!]!
  }
`;
