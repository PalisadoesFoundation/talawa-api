import type { Types } from "mongoose";
import {
  type DefaultGraphQLConnection,
  generateDefaultGraphQLConnection,
} from "./generateDefaultGraphQLConnection";
import type { ParsedGraphQLConnectionArguments } from "./parseGraphQLConnectionArguments";

/**
 * This is typescript type of the callback function `createCursor`.
 */
export type CreateCursor<T0> = (object: T0) => string;

/**
 * This is typescript type of the callback function `createNode`.
 */
export type CreateNode<T0, T1> = (object: T0) => T1;

export type TransformToDefaultGraphQLConnectionArguments<T0, T1, T2> = {
  createCursor?: CreateCursor<T1>;
  createNode?: CreateNode<T1, T2>;
  objectList: T1[];
  parsedArgs: ParsedGraphQLConnectionArguments<T0>;
  totalCount: number;
};

/**
 * This function is used to transform a list of objects to a standard graphQL connection object.
 * @remarks
 * The logic used in this function is common to almost all graphQL connection creation flows,
 * abstracting that away into this function lets developers use a declarative way to create the
 * graphQL connection object they want and prevents code duplication.
 * @example
 * const [objectList, totalCount] = await Promise.all([
 *   User.find(filter)
 *     .sort(sort)
 *     .limit(limit)
 *     .exec(),
 *   User.find(filter)
 *     .countDocuments()
 *     .exec(),
 * ]);
 *
 * return transformToDefaultGraphQLConnection\<
 *  String,
 *  DatabaseUser,
 *  DatabaseUser
 * \>(\{
 *  objectList,
 *  parsedArgs,
 *  totalCount,
 * \});
 */
export function transformToDefaultGraphQLConnection<
  T0,
  T1 extends {
    _id: string | Types.ObjectId;
  },
  T2,
>({
  /**
   * If no custom callback function `createCursor` is provided by the function caller, the default
   * function defined below will execute, the assumption is that `_id` is to be used as the
   * cursor for the graphQL connection edges list.
   */
  createCursor = (object): string => object._id.toString(),
  /**
   * If no custom callback function `createNode` is provided by the function caller, the default
   * function defined below will execute, the assumption is that the type of objects within
   * the `objectList` is the same as type of nodes with connection edges.
   */
  createNode = (object): T2 =>
    ({
      ...object,
      _id: object._id.toString(),
    }) as unknown as T2,
  objectList,
  parsedArgs: { cursor, direction, limit },
  totalCount,
}: TransformToDefaultGraphQLConnectionArguments<
  T0,
  T1,
  T2
>): DefaultGraphQLConnection<T2> {
  // Initialize the connection object.
  const connection = generateDefaultGraphQLConnection<T2>();

  // Following are the two possible cases where this default connection object with
  // unmodified fields is to be returned. First case is when `totalCount == 0`, because
  // this implies that there are no edges available for this connection, second case is
  // when `cursor == null` and `objectList.length == 0`, because this implies that there
  // are no edges available whether forward or backwards paginating. Checking against the
  // first check by itself is sufficient to take care of second case as well.
  if (totalCount === 0) {
    return connection;
  }

  connection.totalCount = totalCount;

  if (direction === "BACKWARD") {
    // The cursor being defined means a connection edge corresponding to that cursor exists.
    if (cursor !== null) {
      connection.pageInfo.hasNextPage = true;
    }
    // This situation occurs when the client queries for a connection with a valid cursor
    // even though there are no more edges to traverse in the backward direction, it means
    // `connection.pageInfo.hasPreviousPage == false` in client's previous connection object,
    // but they query using `connection.pageInfo.startCursor` anyway.
    if (objectList.length === 0) {
      return connection;
    }
    // Number of items in `objectList` being equal to limit means there is at least
    // one additional connection edge available for the client to traverse.
    if (objectList.length === limit) {
      connection.pageInfo.hasPreviousPage = true;
      // Removal of 1 extra object contained in the `objectList`.
      objectList.pop();
    }
    // Order of the `objectList` must be reversed when the graphQL connection is to be traversed
    // is opposite of the expected direction, more info here:-
    // https://relay.dev/graphql/connections.htm#sec-Pagination-algorithm
    objectList = objectList.reverse();
  } else {
    // The cursor being defined means a connection edge corresponding to that cursor exists.
    if (cursor !== null) {
      connection.pageInfo.hasPreviousPage = true;
    }
    // This situation occurs when the client queries for a connection with a valid cursor
    // even though there are no more edges to traverse in the forward direction, it means
    // `connection.pageInfo.hasNextPage == false` in client's previous connection object,
    // but they query using `connection.pageInfo.endCursor` anyway.
    if (objectList.length === 0) {
      return connection;
    }
    // Number of items in `objectList` being equal to limit  means there is at least
    // one additional connection edge available for the client to traverse.
    if (objectList.length === limit) {
      connection.pageInfo.hasNextPage = true;
      // Removal of 1 extra object contained in the `objectList`.
      objectList.pop();
    }
  }

  connection.edges = objectList.map((object) => ({
    cursor: createCursor(object),
    node: createNode(object),
  }));
  connection.pageInfo.startCursor = connection.edges[0].cursor;
  connection.pageInfo.endCursor =
    connection.edges[connection.edges.length - 1].cursor;

  return connection;
}
