import { gql } from "graphql-tag";

export const connectionError = gql`
  union ConnectionError = InvalidCursor | MaximumValueError

  type InvalidCursor implements FieldError {
    message: String!
    path: [String!]!
  }
`;
