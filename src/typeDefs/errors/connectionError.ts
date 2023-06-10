import { gql } from "apollo-server-core";

export const connectionError = gql`
  union ConnectionError = IncorrectCursor | MaximumValueError

  type IncorrectCursor implements FieldError {
    message: String!
    path: [String!]!
  }
`;
