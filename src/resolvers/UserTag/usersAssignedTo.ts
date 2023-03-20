import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, Interface_TagUser } from "../../models";
import { validatePaginationArgs } from "../../libraries/validators/validatePaginationArgs";

export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  // Check if the args provided are either correct forward pagination or backward pagination arguments
  validatePaginationArgs(args);

  let hasNextPage = false,
    hasPreviousPage = false;

  let allusersAssignedTo: Interface_TagUser[] | null;

  // Forward pagination
  if (args.first) {
    // Fetch the users
    allusersAssignedTo = await TagUser.find({
      ...(args.after && {
        userId: {
          $gt: args.after,
        },
      }),
      tagId: parent._id,
    })
      .sort({ userId: 1 })
      .limit(args.first + 1)
      .populate("userId")
      .lean();

    // Populate the page pointer variables
    hasPreviousPage = args.after ? true : false;
    hasNextPage = allusersAssignedTo!.length === args.first + 1;

    if (hasNextPage) allusersAssignedTo!.pop();
  }

  // Backward pagination
  if (args.last) {
    // Fetch the users
    allusersAssignedTo = await TagUser.find({
      ...(args.before && {
        userId: {
          $lt: args.before,
        },
      }),
      tagId: parent._id,
    })
      .sort({ userId: -1 })
      .limit(args.last + 1)
      .populate("userId")
      .lean();

    // Populate the page pointer variables
    hasPreviousPage = args.before ? true : false;
    hasNextPage = allusersAssignedTo!.length === args.last + 1;

    if (hasNextPage) allusersAssignedTo!.pop();

    // Reverse the order of the fetched objects as according to Relay Specification the order of
    // returned objects must always be ascending on the basis of the cursor used
    allusersAssignedTo = allusersAssignedTo!.reverse();
  }

  // Create edges from the fetched objects
  const edges = allusersAssignedTo!.map((tagUser) => ({
    node: tagUser.userId,
    cursor: tagUser.userId._id,
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length ? edges[0].cursor : null,
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
    },
  };
};
