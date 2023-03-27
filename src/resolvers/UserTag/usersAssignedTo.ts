import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, Interface_TagUser, Interface_User } from "../../models";
import { validatePaginationArgs } from "../../libraries/validators/validatePaginationArgs";
import { graphqlConnectionFactory } from "../../utilities/graphqlConnectionFactory";
import { errors, requestContext } from "../../libraries";
import { INVALID_CURSOR_PROVIDED } from "../../constants";

// @ts-ignore
export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  // Check if the args provided are either correct forward pagination or backward pagination arguments
  validatePaginationArgs(args);

  let allusersAssignedTo: Interface_TagUser[] | null;

  const connectionObject = graphqlConnectionFactory<Interface_User>();

  // Forward pagination
  if (args.first) {
    // Fetch the users
    allusersAssignedTo = await TagUser.find({
      ...(args.after && {
        _id: {
          $gte: args.after,
        },
      }),
      tagId: parent._id,
    })
      .sort({ _id: 1 })
      // Let n = args.first
      // If the args.after argument is provided, then n + 2 objects are fetched so that later we can
      // check that the first object should correspond to the after cursor, and the last object is used to
      // determine the existence of the next page
      // If args.after is not provided, only n + 1 objects are fetched to check for the existence of next page
      .limit(args.after ? args.first + 2 : args.first + 1)
      .populate("userId")
      .lean();

    if (args.after) {
      // If args.before is provided, then the first element fetched must coincide with the provided cursor
      if (
        allusersAssignedTo!.length === 0 ||
        allusersAssignedTo![0]._id.toString() !== args.after.toString()
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(INVALID_CURSOR_PROVIDED.MESSAGE),
          INVALID_CURSOR_PROVIDED.PARAM,
          INVALID_CURSOR_PROVIDED.CODE
        );
      }

      // Remove the object with _id = args.after and set hasPreviousPage as true
      allusersAssignedTo!.shift();
      connectionObject.pageInfo.hasPreviousPage = true;
    }

    if (allusersAssignedTo!.length === 0)
      // Return the default object if the recieved list is empty
      return connectionObject;

    // Populate the page pointer variables
    if (allusersAssignedTo!.length === args.first + 1) {
      connectionObject.pageInfo.hasNextPage = true;
      allusersAssignedTo!.pop();
    }
  }

  // Backward pagination
  if (args.last) {
    // Fetch the users
    allusersAssignedTo = await TagUser.find({
      ...(args.before && {
        _id: {
          $lte: args.before,
        },
      }),
      tagId: parent._id,
    })
      .sort({ _id: -1 })
      // Let n = args.last
      // If the args.before argument is provided, then n + 2 objects are fetched so that later we can
      // check that the first object should correspond to the before cursor, and the last object is used to
      // determine the existence of the next page
      // If args.before is not provided, only n + 1 objects are fetched to check for the existence of next page
      .limit(args.before ? args.last + 2 : args.last + 1)
      .populate("userId")
      .lean();

    if (args.before) {
      // If args.before is provided, then the first element fetched must coincide with the provided cursor
      if (
        allusersAssignedTo!.length === 0 ||
        allusersAssignedTo![0]._id.toString() !== args.before.toString()
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(INVALID_CURSOR_PROVIDED.MESSAGE),
          INVALID_CURSOR_PROVIDED.PARAM,
          INVALID_CURSOR_PROVIDED.CODE
        );
      }

      // Remove the object with _id = args.before and set hasPreviousPage as true
      allusersAssignedTo!.shift();
      connectionObject.pageInfo.hasPreviousPage = true;
    }

    // Return the default object if the recieved list is empty
    if (allusersAssignedTo!.length === 0) return connectionObject;

    // Populate the page pointer variables
    if (allusersAssignedTo!.length === args.last + 1) {
      connectionObject.pageInfo.hasNextPage = true;
      allusersAssignedTo!.pop();
    }

    // Reverse the order of the fetched objects as according to Relay Specification, the order of
    // returned objects must always be ascending on the basis of the cursor used
    allusersAssignedTo = allusersAssignedTo!.reverse();
  }

  // Create edges from the fetched objects
  connectionObject.edges = allusersAssignedTo!.map((tagUser) => ({
    node: tagUser.userId,
    cursor: tagUser._id.toString(),
  }));

  // Set the start and end cursor
  connectionObject.pageInfo.startCursor = connectionObject.edges[0]!.cursor;
  connectionObject.pageInfo.endCursor =
    connectionObject.edges[connectionObject.edges.length - 1]!.cursor;

  return connectionObject;
};
