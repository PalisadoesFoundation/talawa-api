import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_User, TagUser } from "../../models";

export const usersAssignedTo: TagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  const allUsers = await TagUser.find({
    // @ts-ignore
    tagId: parent._id,
    _id: {
      $gt: args.after,
      $lte: args.before,
    },
  })
    .select({
      userId: 1,
    })
    .populate("userId")
    .lean()
    // @ts-ignore
    .map((user) => user.userId);

  let edges = allUsers.map((user: Interface_User) => ({
    node: user,
    cursor: user._id,
  }));

  // The pagination is based on the Relay specification
  // If is highly unadvisable to use both the after and before arguments together as it leads to incoherent results
  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    hasPreviousPage = await TagUser.exists({
      _id: {
        $lte: args.after,
      },
      tagId: parent._id,
    });
  }

  if (args.last) {
    // @ts-ignore
    hasNextPage = await TagUser.exists({
      _id: {
        // @ts-ignore
        $gt: args.before,
      },
      tagId: parent._id,
    });
  }

  if (args.first) {
    hasNextPage = edges.length > args.first;
    if (hasNextPage) {
      edges = edges.slice(0, args.first);
    }
  }

  if (args.last) {
    if (args.last) hasPreviousPage = edges.length > args.last;
    if (hasPreviousPage) {
      edges = edges.slice(-args.last, 0);
    }
  }

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
  };
};
