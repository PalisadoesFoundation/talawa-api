import {
  ConnectionPageInfo,
  PaginationError,
} from "../types/generatedGraphQLTypes";
import {
  validatePaginationArgs,
  CursorPaginationArgsType,
} from "../libraries/validators/validatePaginationArgs";
import { Model, FilterQuery, Types } from "mongoose";

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

// Constant errors that are thrown by the createCOnnectionFactory function
const ForwardPaginationIncorrectCursorError = {
  connectionData: null,
  connectionErrors: [
    {
      __typename: "IncorrectCursor",
      message: "The provided after cursor does not exist in the database.",
      path: "after",
    },
  ],
};

const BackwardPaginationIncorrectCursorError = {
  connectionData: null,
  connectionErrors: [
    {
      __typename: "IncorrectCursor",
      message: "The provided after cursor does not exist in the database.",
      path: "before",
    },
  ],
};

/*
This is a factory function to quickly create a graphql connection object. The function accepts a generic type
'T' which is used to reference the type of node that this connection and it's edges will reference. A node is
a business object which can be uniquely identified in graphql. For example `User`, `Organization`, `Event`, `Post` etc.
All of these objects are viable candiates for a node and can be paginated using graphql connections. The default object returned by this function represents a connection which has no data at all, i.e., the table/collection for that node(along with ther constraints like filters if any) is completely empty in database. 
This object will need to be transformed according to different logic inside resolvers.
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

// Type definition for a mapping funtion
type GetNodeFromResultFnType<T, U> = {
  (result: U): T;
};

// Type definition for the filter query arguments
type PaginationFilterQueryType = {
  [key: string]:
    | {
        $lte: string;
      }
    | {
        $gte: string;
      };
};

// A common interface that denotes all Mongoose objects (all of them must have an _id field)
interface Interface_MongooseObject {
  _id: Types.ObjectId;
}

// Genrates the relevant filterQuery that can be passed into the .find() method
function getFilterQuery<U extends Interface_MongooseObject>(
  args: CursorPaginationArgsType,
  filterQuery: FilterQuery<U>
): PaginationFilterQueryType {
  const finalFilterQuery: PaginationFilterQueryType = { ...filterQuery };

  if (args.after)
    finalFilterQuery["_id"] = {
      $gte: args.after,
    };

  if (args.before)
    finalFilterQuery["_id"] = {
      $lte: args.before,
    };

  return finalFilterQuery;
}

// Generates the limit that can should be passed in the .limit() method
const getLimit = (args: CursorPaginationArgsType) => {
  // We always fetch 1 object more than the limit (args.first/args.last) so that we can use that to get the information about hasNextPage / hasPreviousPage
  // When args.after / args.before is supplied, we fetch 1 more object so as validate the cursor as well
  if (args.first) return args.after ? args.first + 2 : args.first + 1;
  if (args.last) return args.before ? args.last + 2 : args.last + 1;
};

// Generates the sortingObject that can be passed in the .sort() method
function getSortingObject(
  args: CursorPaginationArgsType,
  sortingObject: { [key: string]: number }
) {
  // We assume that the resolver would always be written with respect to the sorting that needs to be implemented for forward pagination
  if (args.first) return sortingObject;

  // If we are paginating backwards, then we must reverse the order of all fields that are being sorted by.
  for (const [key, value] of Object.entries(sortingObject)) {
    sortingObject[key] = value * -1;
  }
  return sortingObject;
}

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
3. sortingObject: Refers to the properties by which you want to sort the database query by. Can be left blank. Should have the keys as fields on the object U and the values as 1 or -1 (to represent asc abd desc respectively)
4. filterQuery: Refers to the filter object that you want to pass to the .find() query which quering the databaseModel 
For example, User, Tag, Post, Organization etc.
5. fieldsToPopulate: A string that lists all the fields that you want to be populated in the model.
  It is an optional parameter and can be skipped.
6. getNodeFromResult: Describes a transformation function that given an object of type U, would convert it to the desired object of type T. This would mostly include mapping to some specific field of the fetched object.

It is important to know that the function would would sequentially in the following manner:
1. Fetch all the documents specified by your filter query.
2. Sort them by the field provided.
3. Populate the fields provided.
4. Run the functions getNodeFromResult on each of the fetched objects from the database.

The function returns a promise which would resolve to the desired connection object (of the type Interface_Connection<T>).
*/
export async function createGraphQLConnection<
  T extends Interface_MongooseObject,
  U extends Interface_MongooseObject
>(
  args: CursorPaginationArgsType,
  databaseModel: Model<U>,
  sortingObject: { [key: string]: number },
  filterQuery: FilterQuery<U>,
  fieldsToPopulate: string | null,
  getNodeFromResult: GetNodeFromResultFnType<T, U>
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

  const connectionFilterQuery = getFilterQuery(args, filterQuery);
  const connectionSortingObject = getSortingObject(args, sortingObject);
  const connectionLimit = getLimit(args);

  // Fetch the objects
  if (fieldsToPopulate) {
    allFetchedObjects = await databaseModel
      .find(connectionFilterQuery as FilterQuery<U>)
      .sort(connectionSortingObject)
      .limit(connectionLimit)
      .populate(fieldsToPopulate)
      .lean();
  } else {
    allFetchedObjects = await databaseModel
      .find(connectionFilterQuery as FilterQuery<U>)
      .sort(connectionSortingObject)
      .limit(connectionLimit)
      .lean();
  }

  // Return the default object if the recieved list is empty
  if (!allFetchedObjects || allFetchedObjects.length === 0)
    return {
      connectionData: connectionObject,
      connectionErrors: null,
    };

  // Logic to handle the forward pagination
  if (args.first) {
    // If args.after is provided, then the first fetched element must coincide with the provided cursor
    if (args.after) {
      if (allFetchedObjects[0]._id.toString() !== args.after.toString())
        return ForwardPaginationIncorrectCursorError;

      // Remove the object with _id = args.after and set hasPreviousPage as true
      allFetchedObjects!.shift();
      connectionObject.pageInfo.hasPreviousPage = true;
    }
    // Populate the page pointer variables
    if (allFetchedObjects!.length === args.first + 1) {
      connectionObject.pageInfo.hasNextPage = true;
      allFetchedObjects!.pop();
    }
  }

  if (args.last) {
    // If args.before is provided, then the first fetched element must coincide with the provided cursor
    if (args.before) {
      if (
        allFetchedObjects[0]._id.equals.toString() !== args.before.toString()
      ) {
        return BackwardPaginationIncorrectCursorError;
      }

      // Remove the object with _id = args.before and set hasNextPage as true
      allFetchedObjects!.shift();
      connectionObject.pageInfo.hasNextPage = true;
    }

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
    cursor: object._id.toString(),
  }));

  // Set the start and end cursor
  connectionObject.pageInfo.startCursor = connectionObject.edges[0]!.cursor;
  connectionObject.pageInfo.endCursor =
    connectionObject.edges[connectionObject.edges.length - 1]!.cursor;

  return {
    connectionData: connectionObject,
    connectionErrors: null,
  };
}
