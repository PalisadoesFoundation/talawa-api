import { ConnectionPageInfo } from "../types/generatedGraphQLTypes";
import {
  validatePaginationArgs,
  CursorPaginationArgsType,
} from "../libraries/validators/validatePaginationArgs";
import { Model } from "mongoose";
import { FilterQuery } from "mongoose";
import { errors, requestContext } from "../libraries";
import { INVALID_CURSOR_PROVIDED } from "../constants";

interface Interface_ConnectionEdge<T> {
  cursor: string;
  node: T;
}

interface Interface_Connection<T> {
  edges?: Array<Interface_ConnectionEdge<T> | null | undefined>;
  pageInfo: ConnectionPageInfo;
}

/*
This is a factory function to quickly create a graphql
connection object. The function accepts a generic type
'T' which is used to reference the type of node that this
connection and it's edges will reference. A node is
a business object which can be uniquely identified in graphql.
For example `User`, `Organization`, `Event`, `Post` etc.
All of these objects are viable candiates for a node and
can be paginated using graphql connections. The default object
returned by this function represents a connection which has no
data at all, i.e., the table/collection for that node(along with
other constraints like filters if any) is completely empty in database.
This object will need to be transformed according to different
logic inside resolvers.
*/
export function graphqlConnectionFactory<T>(): Interface_Connection<T> {
  return {
    edges: [],
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}

type GetNodeFromResultFnType<T, U> = {
  (result: U): T;
};

type GetCursorFromNodeFnType<T> = {
  (node: T): string;
};

/*
This is a function which generates a GraphQL cursor pagination resolver based on the requirements of the client.

The function takes the following arguments: 

A. TYPE PARAMETERS

1. S: Refers to the parent type for which the resolver is being implemented
2. T: Refers the type of the node that the connection and it's edges would refer. 
Example values include `Interface_User`, `Interface_Organization`, `Interface_Event`, `Interface_Post`.
3. U: Regers to the type of interface that is implemented by the model that you want to query. 
For example, if you want to query the TagUser Model, then you would send Interface_UserTag for this type parameter

B. DATA PARAMETERS

1. parent: Refers to the parent object that is returned by the previous resolver.
2. args: These are the actual args that are send by the client in the request.
3. databaseModel: Refers to the actual database model that you want to query.
4. filerQuery: Refers to the filter object that you want to pass to the .find() query which quering the databaseModel 
For example, User, Tag, Post, Organization etc.


The function returns a promise which would resolve to the desired connection object (of the type Interface_Connection<T>).
*/
export async function createGraphQLConnection<S, T, U>(
  parent: S,
  args: CursorPaginationArgsType,
  databaseModel: Model<U>,
  filterQuery: FilterQuery<U>,
  getNodeFromResult: GetNodeFromResultFnType<T, U>,
  getCursorFromNode: GetCursorFromNodeFnType<T>
): Promise<Interface_Connection<T>> {
  // Check that the provided arguments must either be correct forward pagination
  // arguments or correct backward pagination arguments
  validatePaginationArgs(args);

  // Initialize the object list and the connection object
  let allFetchedObjects: U[] | null;
  const connectionObject = graphqlConnectionFactory<T>();

  const afterFilterQuery = {
    ...(args.after && {
      _id: {
        $gte: args.after,
      },
    }),
  };

  const beforeFilterQuery = {
    ...(args.before && {
      _id: {
        $lte: args.before,
      },
    }),
  };

  // Forward pagination
  if (args.first) {
    // Fetch the users
    allFetchedObjects = await databaseModel
      .find({
        ...afterFilterQuery,
        ...filterQuery,
      })
      .sort({ _id: 1 })
      // Let n = args.first
      // If args.after argument is provided, then n + 2 objects are fetched so that we can
      // ensure the validity of the after cursor by comparing it with the first object, and
      // then use the last fetched object to determine the existence of the next page.
      // If args.after is not provided, only n + 1 objects are fetched to check for the existence of the next page.
      .limit(args.after ? args.first + 2 : args.first + 1)
      // .populate("userId")
      .lean();

    if (args.after) {
      // If args.after is provided, then the first fetched element must coincide with the provided cursor
      if (
        !allFetchedObjects ||
        allFetchedObjects.length === 0 ||
        getCursorFromNode(getNodeFromResult(allFetchedObjects[0])) !==
          args.after.toString()
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(INVALID_CURSOR_PROVIDED.MESSAGE),
          INVALID_CURSOR_PROVIDED.PARAM,
          INVALID_CURSOR_PROVIDED.CODE
        );
      }

      // Remove the object with _id = args.after and set hasPreviousPage as true
      allFetchedObjects!.shift();
      connectionObject.pageInfo.hasPreviousPage = true;
    }

    if (allFetchedObjects!.length === 0)
      // Return the default object if the recieved list is empty
      return connectionObject;

    // Populate the page pointer variables
    if (allFetchedObjects!.length === args.first + 1) {
      connectionObject.pageInfo.hasNextPage = true;
      allFetchedObjects!.pop();
    }
  }

  // Backward pagination
  if (args.last) {
    // Fetch the users
    allFetchedObjects = await databaseModel
      .find({
        ...beforeFilterQuery,
        ...filterQuery,
      })
      .sort({ _id: -1 })
      // Let n = args.last
      // If args.before argument is provided, then n + 2 objects are fetched so that we can
      // ensure the validity of the before cursor by comparing it with the first object, and
      // then use the last fetched object to determine the existence of the next page.
      // If args.before is not provided, only n + 1 objects are fetched to check for the existence of the next page.
      .limit(args.before ? args.last + 2 : args.last + 1)
      // .populate("userId")
      .lean();

    if (args.before) {
      // If args.before is provided, then the first fetched element must coincide with the provided cursor
      if (
        !allFetchedObjects ||
        allFetchedObjects.length === 0 ||
        getCursorFromNode(getNodeFromResult(allFetchedObjects[0])) !==
          args.before.toString()
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(INVALID_CURSOR_PROVIDED.MESSAGE),
          INVALID_CURSOR_PROVIDED.PARAM,
          INVALID_CURSOR_PROVIDED.CODE
        );
      }

      // Remove the object with _id = args.before and set hasNextPage as true
      allFetchedObjects!.shift();
      connectionObject.pageInfo.hasNextPage = true;
    }

    // Return the default object if the recieved list is empty
    if (allFetchedObjects!.length === 0) return connectionObject;

    // Populate the page pointer variables
    if (allFetchedObjects!.length === args.last + 1) {
      connectionObject.pageInfo.hasPreviousPage = true;
      allFetchedObjects!.pop();
    }
  }

  // Create edges from the fetched objects
  connectionObject.edges = allFetchedObjects!.map((object: U) => {
    const node = getNodeFromResult(object);
    return {
      node,
      cursor: getCursorFromNode(node),
    };
  });

  // Set the start and end cursor
  connectionObject.pageInfo.startCursor = connectionObject.edges[0]!.cursor;
  connectionObject.pageInfo.endCursor =
    connectionObject.edges[connectionObject.edges.length - 1]!.cursor;

  return connectionObject;
}
