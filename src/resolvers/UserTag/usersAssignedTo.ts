import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, Interface_TagUser } from "../../models";

export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  const allusersAssignedTo: Interface_TagUser[] = await TagUser.find({
    userId: {
      $gt: args.after ? args.after : "0".repeat(24),
      $lt: args.before ? args.before : "f".repeat(24),
    },
    tagId: parent._id,
  })
    .sort({ userId: 1 })
    .populate("userId")
    .lean();

  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    hasPreviousPage = await TagUser.exists({
      userId: {
        $lte: args.after,
      },
      tagId: parent._id,
    });
  }

  if (args.before) {
    hasNextPage = await TagUser.exists({
      userId: {
        $gte: args.before,
      },
      tagId: parent!._id,
    });
  }

  let edges = allusersAssignedTo.map((tagUser) => ({
    node: tagUser.userId,
    cursor: tagUser.userId._id,
  }));

  if (args.first) {
    hasNextPage = edges.length > args.first;
    if (hasNextPage) {
      edges = edges.slice(0, args.first);
    }
  }

  if (args.last) {
    hasPreviousPage = edges.length > args.last;
    if (hasPreviousPage) {
      edges = edges.slice(-args.last);
    }
  }

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
