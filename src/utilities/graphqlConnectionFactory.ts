import {
  ConnectionPageInfo,
  PaginationError,
} from "../types/generatedGraphQLTypes";
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

interface Interface_ConnectionResult<T> {
  connectionData: Interface_Connection<T> | null;
  connectionErrors: PaginationError[] | null;
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

type GetCursorFromResultFnType<U> = {
  (result: U): string;
};

type AfterFilterQueryType = {
  [key: string]: {
    $gte: string;
  };
};

type BeforeFilterQueryType = {
  [key: string]: {
    $lte: string;
  };
};

/*
This is a function which generates a GraphQL cursor pagination resolver based on the requirements of the client.

The function takes the following arguments: 

A. TYPE PARAMETERS

1. T: Refers the type of the node that the connection and it's edges would refer. 
Example values include `Interface_User`, `Interface_Organization`, `Interface_Event`, `Interface_Post`.
2. U: Regers to the type of interface that is implemented by the model that you want to query. 
For example, if you want to query the TagUser Model, then you would send Interface_UserTag for this type parameter

B. DATA PARAMETERS

1. args: These are the actual args that are send by the client in the request.
2. databaseModel: Refers to the actual database model that you want to query.
3. fieldToSortBy: Refers to the field on the Type U that you want to act as the cursor (ansd thus would be used
  for filtering and sorting or results). Can use the . notation to access nested values
4. filterQuery: Refers to the filter object that you want to pass to the .find() query which quering the databaseModel 
For example, User, Tag, Post, Organization etc.
5. fieldsToPopulate: A string that lists all the fields that you want to be populated in the model.
  It is an optional parameter and can be skipped.
6. getNodeFromResult: Describes a transformation function that given an object of type U, would convert it to the desired object of type T. This would mostly include mapping to some specific field of the fetched object.
7. getCursorFromResult: Describes a transformation function that is used to generate the cursor from a particular fetched 
  result object of type U. This would mostly be a mapping function. It must be noted that this field should exactly match
  the field provided in the fieldToSortBy argument to get sensible results.

It is important to know that the function would would sequentially in the following manner:
1. Fetch all the documents specified by your filter query.
2. Sort them by the field provided.
3. Populate the fields provided.
4. Run the functions getNodeFromResult and getCursorFromResult on each of the fetched objects from the database.

The function returns a promise which would resolve to the desired connection object (of the type Interface_Connection<T>).
*/
export async function createGraphQLConnection<T, U>(
  args: CursorPaginationArgsType,
  databaseModel: Model<U>,
  fieldToSortBy: string,
  filterQuery: FilterQuery<U>,
  fieldsToPopulate: string | null,
  getNodeFromResult: GetNodeFromResultFnType<T, U>,
  getCursorFromResult: GetCursorFromResultFnType<U>
): Promise<Interface_ConnectionResult<T>> {
  // Check that the provided arguments must either be correct forward pagination
  // arguments or correct backward pagination arguments
  const connectionErrors = validatePaginationArgs(args);

  if (connectionErrors.length !== 0) {
    return {
      connectionData: null,
      connectionErrors,
    };
  }
  // Initialize the object list and the connection object
  let allFetchedObjects: U[] | null;
  const connectionObject = graphqlConnectionFactory<T>();

  const afterFilterQuery: AfterFilterQueryType = {};
  if (args.after)
    afterFilterQuery[fieldToSortBy] = {
      $gte: args.after,
    };

  const beforeFilterQuery: BeforeFilterQueryType = {};
  if (args.before)
    beforeFilterQuery[fieldToSortBy] = {
      $lte: args.before,
    };

  const getSortingObject = (ord: number) => {
    const obj: { [key: string]: number } = {};
    obj[fieldToSortBy] = ord;
    return obj;
  };

  // Forward pagination
  if (args.first) {
    // Fetch the users
    if (fieldsToPopulate) {
      allFetchedObjects = await databaseModel
        .find({
          ...afterFilterQuery,
          ...filterQuery,
        })
        .sort(getSortingObject(1))
        // Let n = args.first
        // If args.after argument is provided, then n + 2 objects are fetched so that we can
        // ensure the validity of the after cursor by comparing it with the first object, and
        // then use the last fetched object to determine the existence of the next page.
        // If args.after is not provided, only n + 1 objects are fetched to check for the existence of the next page.
        .limit(args.after ? args.first + 2 : args.first + 1)
        .populate(fieldsToPopulate)
        .lean();
    } else {
      allFetchedObjects = await databaseModel
        .find({
          ...afterFilterQuery,
          ...filterQuery,
        })
        .sort(getSortingObject(1))
        .limit(args.after ? args.first + 2 : args.first + 1)
        .lean();
    }

    if (args.after) {
      // If args.after is provided, then the first fetched element must coincide with the provided cursor
      if (
        !allFetchedObjects ||
        allFetchedObjects.length === 0 ||
        getCursorFromResult(allFetchedObjects[0]) !== args.after.toString()
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
    if (fieldsToPopulate) {
      allFetchedObjects = await databaseModel
        .find({
          ...beforeFilterQuery,
          ...filterQuery,
        })
        .sort(getSortingObject(-1))
        // Let n = args.last
        // If args.before argument is provided, then n + 2 objects are fetched so that we can
        // ensure the validity of the before cursor by comparing it with the first object, and
        // then use the last fetched object to determine the existence of the next page.
        // If args.before is not provided, only n + 1 objects are fetched to check for the existence of the next page.
        .limit(args.before ? args.last + 2 : args.last + 1)
        .populate(fieldsToPopulate)
        .lean();
    } else {
      allFetchedObjects = await databaseModel
        .find({
          ...beforeFilterQuery,
          ...filterQuery,
        })
        .sort(getSortingObject(-1))
        .limit(args.before ? args.last + 2 : args.last + 1)
        .populate(fieldsToPopulate)
        .lean();
    }

    if (args.before) {
      // If args.before is provided, then the first fetched element must coincide with the provided cursor
      if (
        !allFetchedObjects ||
        allFetchedObjects.length === 0 ||
        getCursorFromResult(allFetchedObjects[0]) !== args.before.toString()
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

    // Reverse the order of the fetched objects as according to Relay Specification, the order of
    // returned objects must always be ascending on the basis of the cursor used
    allFetchedObjects = allFetchedObjects!.reverse();
  }

  // Create edges from the fetched objects
  connectionObject.edges = allFetchedObjects!.map((object: U) => ({
    node: getNodeFromResult(object),
    cursor: getCursorFromResult(object),
  }));

  // Set the start and end cursor
  connectionObject.pageInfo.startCursor = connectionObject.edges[0]!.cursor;
  connectionObject.pageInfo.endCursor =
    connectionObject.edges[connectionObject.edges.length - 1]!.cursor;

  return connectionObject;
}
