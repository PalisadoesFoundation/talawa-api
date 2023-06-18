import { gql } from "apollo-server-core";

export const connectionError = gql`
  union ConnectionError = InvalidCursor | MaximumValueError

  type InvalidCursor implements FieldError {
    message: String!
    path: [String!]!
  }
`;
