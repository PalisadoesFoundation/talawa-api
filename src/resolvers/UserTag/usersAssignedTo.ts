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
  // Check that the provided arguments must either be correct forward pagination arguments or correct backward pagination arguments
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
      // If args.after argument is provided, then n + 2 objects are fetched so that we can
      // ensure the validity of the after cursor by comparing it with the first object, and
      // then use the last fetched object to determine the existence of the next page.
      // If args.after is not provided, only n + 1 objects are fetched to check for the existence of the next page.
      .limit(args.after ? args.first + 2 : args.first + 1)
      .populate("userId")
      .lean();

    if (args.after) {
      // If args.after is provided, then the first fetched element must coincide with the provided cursor
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
      // If args.before argument is provided, then n + 2 objects are fetched so that we can
      // ensure the validity of the before cursor by comparing it with the first object, and
      // then use the last fetched object to determine the existence of the next page.
      // If args.before is not provided, only n + 1 objects are fetched to check for the existence of the next page.
      .limit(args.before ? args.last + 2 : args.last + 1)
      .populate("userId")
      .lean();

    if (args.before) {
      // If args.before is provided, then the first fetched element must coincide with the provided cursor
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

      // Remove the object with _id = args.before and set hasNextPage as true
      allusersAssignedTo!.shift();
      connectionObject.pageInfo.hasNextPage = true;
    }

    // Return the default object if the recieved list is empty
    if (allusersAssignedTo!.length === 0) return connectionObject;

    // Populate the page pointer variables
    if (allusersAssignedTo!.length === args.last + 1) {
      connectionObject.pageInfo.hasPreviousPage = true;
      allusersAssignedTo!.pop();
    }
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
