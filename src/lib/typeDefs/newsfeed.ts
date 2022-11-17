import { gql } from "apollo-server-core";

/**
 * This graphQL typeDef defines the schema-defintion and 
 * contains query logic to interact with `Post` and related schemas.
 */
export const newsfeed = gql`
  type Post {
    _id: ID
    text: String!
    title: String
    createdAt: String
    imageUrl: String
    videoUrl: String
    creator: User!
    organization: Organization!
    likedBy: [User]
    comments: [Comment]
    likeCount: Int
    commentCount: Int
  }

  input PostWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    text: String
    text_not: String
    text_in: [String!]
    text_not_in: [String!]
    text_contains: String
    text_starts_with: String

    title: String
    title_not: String
    title_in: [String!]
    title_not_in: [String!]
    title_contains: String
    title_starts_with: String
  }

  """
  A connection to a list of items.
  """
  type PostConnection {
    """
    Information to aid in pagination.
    """
    pageInfo: PageInfo!

    """
    A list of edges.
    """
    edges: [Post]!

    aggregate: AggregatePost!
  }

  type AggregatePost {
    count: Int!
  }

  input PostInput {
    _id: ID
    text: String!
    title: String
    imageUrl: String
    videoUrl: String
    organizationId: ID!
  }

  type Comment {
    _id: ID
    text: String!
    createdAt: String
    creator: User!
    post: Post!
    likedBy: [User]
    likeCount: Int
  }

  input CommentInput {
    text: String!
  }

  enum PostOrderByInput {
    id_ASC
    id_DESC
    text_ASC
    text_DESC
    title_ASC
    title_DESC
    createdAt_ASC
    createdAt_DESC
    imageUrl_ASC
    imageUrl_DESC
    videoUrl_ASC
    videoUrl_DESC
    likeCount_ASC
    likeCount_DESC
    commentCount_ASC
    commentCount_DESC
  }
`;
