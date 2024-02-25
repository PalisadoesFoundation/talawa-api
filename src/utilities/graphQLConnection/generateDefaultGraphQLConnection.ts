import type { ConnectionPageInfo } from "../../types/generatedGraphQLTypes";

/**
 * This is typescript type of a base graphQL connection edge object. This connection edge object
 * can be extended to create a custom connection edge object as long as the new connection edge
 * object adheres to the default type of this base connection edge object.
 */
export type DefaultGraphQLConnectionEdge<T0> = {
  cursor: string;
  node: T0;
};

/**
 * This is typescript type of a base graphQL connection object. This connection object can be
 * extended to create a custom connnection object as long as the new connection object adheres
 * to the default type of this base connection object.
 */
export type DefaultGraphQLConnection<T0> = {
  edges: DefaultGraphQLConnectionEdge<T0>[];
  pageInfo: ConnectionPageInfo;
  totalCount: number;
};

/**
 * This is a factory function to create a base graphql connection object with default fields
 * that correspond to a connection with no data and no traversal properties in any direction.
 * @example
 * const connection = generateDefaultGraphQLConnection();
 */
export function generateDefaultGraphQLConnection<
  T0,
>(): DefaultGraphQLConnection<T0> {
  return {
    edges: [],
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
    totalCount: 0,
  };
}
