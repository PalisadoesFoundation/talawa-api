import type {
  ConnectionPageInfo,
  ConnectionError,
} from "../types/generatedGraphQLTypes";
import type { CursorPaginationArgsType } from "../libraries/validators/validatePaginationArgs";
import type { Types } from "mongoose";

interface InterfaceConnectionEdge<T> {
  cursor: string;
  node: T;
}

interface InterfaceConnection<T> {
  edges: InterfaceConnectionEdge<T>[];
  pageInfo: ConnectionPageInfo;
}

interface InterfaceConnectionResult<T> {
  connectionData: InterfaceConnection<T> | null;
  connectionErrors: ConnectionError[];
}

/*
This is a factory function to quickly create a graphql connection object. The function accepts a generic type
'T' which is used to reference the type of node that this connection and it's edges will reference. A node is
a business object which can be uniquely identified in graphql. For example `User`, `Organization`, `Event`, `Post` etc.
All of these objects are viable candiates for a node and can be paginated using graphql connections. The default object returned by this function represents a connection which has no data at all, i.e., the table/collection for that node(along with ther constraints like filters if any) is completely empty in database. 
This object will need to be transformed according to different logic inside resolvers.
*/
export function graphqlConnectionFactory<T>(): InterfaceConnection<T> {
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

// Type definition for a mapping funtion
type GetNodeFromResultFnType<T1, T2> = {
  (result: T2): T1;
};

// A custom type for easier implementation of the business logic of the connection factory
export type ConnectionArguments = {
  cursor: string | null | undefined;
  direction: "BACKWARD" | "FORWARD";
  limit: number;
};

// Utility to convert the recieved arguments to the ConnetionArguments type
export const transformArguments = (
  args: CursorPaginationArgsType
): ConnectionArguments => {
  const transformedArgs: ConnectionArguments = {
    cursor: undefined,
    direction: args.first ? "FORWARD" : "BACKWARD",
    limit: args.first | args.last,
  };

  if (args.after) transformedArgs.cursor = args.after;
  else if (args.before) transformedArgs.cursor = args.before;

  return transformedArgs;
};

// Generates the limit that can should be passed in the .limit() method
export const getLimit = (args: ConnectionArguments): number => {
  // We always fetch 1 object more than  args.limit
  // so that we can use that to get the information about hasNextPage / hasPreviousPage
  // When args.cursor is supplied, we fetch 1 more object so as validate the cursor as well
  return args.cursor ? args.limit + 2 : args.limit + 1;
};

// Generates the sortingObject that can be passed in the .sort() method
export const getSortingObject = (
  direction: "FORWARD" | "BACKWARD",
  sortingObject: { [key: string]: number }
): { [key: string]: number } => {
  // We assume that the resolver would always be written with respect to the sorting that needs to be implemented for forward pagination
  if (direction === "FORWARD") return sortingObject;

  // If we are paginating backwards, then we must reverse the order of all fields that are being sorted by.
  for (const [key, value] of Object.entries(sortingObject)) {
    sortingObject[key] = value * -1;
  }

  return sortingObject;
};

type FilterObjectType = {
  _id: {
    [key: string]: string;
  };
};

// Generates the sorting arguments for filterQuery that can be passed into the .find() method
export function getFilterObject(
  args: ConnectionArguments
): FilterObjectType | null {
  if (args.cursor) {
    if (args.direction === "FORWARD") return { _id: { $gte: args.cursor } };
    else return { _id: { $lte: args.cursor } };
  }

  return null;
}

/*
This is a function which generates a GraphQL cursor pagination object based on the requirements of the client.

The function takes the following arguments: 

A. TYPE PARAMETERS

1. T1: Refers the type of the node that the connection and it's edges would refer. 
Example values include `Interface_User`, `Interface_Organization`, `Interface_Event`, `Interface_Post`.
2. T2: Regers to the type of interface that is implemented by the model that you want to query. 
For example, if you want to query the TagUser Model, then you would send Interface_UserTag for this type parameter

B. DATA PARAMETERS

1. args: These are the tranformed arguments that were orginally passed in the request.
2. allFetchedObjects: Refers to objects that were fetched from the database thorugh a query.
3. getNodeFromResult: Describes a transformation function that given an object of type T2, would convert it to the desired object of type T1. This would mostly include mapping to some specific field of the fetched object.

The function returns a promise which would resolve to the desired connection object (of the type InterfaceConnection<T1>).
*/
export function generateConnectionObject<
  T1 extends { _id: Types.ObjectId },
  T2 extends { _id: Types.ObjectId }
>(
  args: ConnectionArguments,
  allFetchedObjects: T2[] | null,
  getNodeFromResult: GetNodeFromResultFnType<T1, T2>
): InterfaceConnectionResult<T1> {
  // Initialize the connection object
  const connectionObject = graphqlConnectionFactory<T1>();

  // Return the default object if the recieved list is empty
  if (!allFetchedObjects || allFetchedObjects.length === 0)
    return {
      connectionData: connectionObject,
      connectionErrors: [],
    };

  // Handling the case when the cursor is provided
  if (args.cursor) {
    // Validate the cursor
    if (allFetchedObjects[0]._id.toString() !== args.cursor) {
      return {
        connectionData: null,
        connectionErrors: [
          {
            __typename: "IncorrectCursor",
            message: "The provided cursor does not exist in the database.",
            path: [args.direction === "FORWARD" ? "after" : "before"],
          },
        ],
      };
    }

    // Remove the first object which was compared to the cursor in the previous step
    allFetchedObjects!.shift();
    // Populate the relevant pageInfo fields
    if (args.direction === "FORWARD")
      connectionObject.pageInfo.hasPreviousPage = true;
    else connectionObject.pageInfo.hasNextPage = true;
  }

  // Populate the page pointer variable
  if (allFetchedObjects!.length === args.limit + 1) {
    if (args.direction === "FORWARD")
      connectionObject.pageInfo.hasNextPage = true;
    else connectionObject.pageInfo.hasPreviousPage = true;
    allFetchedObjects!.pop();
  }

  // Reverse the order of the fetched objects in backward pagination,
  // as according to the Relay Specification, the order of
  // returned objects must always be ascending on the basis of the cursor used
  if (args.direction === "BACKWARD")
    allFetchedObjects = allFetchedObjects!.reverse();

  // Create edges from the fetched objects
  connectionObject.edges = allFetchedObjects!.map((object: T2) => ({
    node: getNodeFromResult(object),
    cursor: object._id.toString(),
  }));

  // Set the start and end cursor
  connectionObject.pageInfo.startCursor = connectionObject.edges[0]!.cursor;
  connectionObject.pageInfo.endCursor =
    connectionObject.edges[connectionObject.edges.length - 1]!.cursor;

  return {
    connectionData: connectionObject,
    connectionErrors: [],
  };
}
