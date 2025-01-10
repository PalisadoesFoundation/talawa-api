import { gql } from "graphql-tag";

/**
 * GraphQL schema definition for errors related to creating a comment.
 */

export const createCommentErrors = gql`
  type PostNotFoundError implements Error {
    message: String!
  }

  union CreateCommentError = PostNotFoundError
`;
