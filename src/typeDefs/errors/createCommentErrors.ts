import { gql } from "graphql-tag";

export const createCommentErrors = gql`
  type PostNotFoundError implements Error {
    message: String!
  }

  union CreateCommentError = PostNotFoundError
`;
