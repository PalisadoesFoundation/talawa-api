import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_TagUser, TagUser } from "../../models";

export const tagsAssignedWith: UserResolvers["tagsAssignedWith"] = async (
  parent,
  args
) => {
  // This pagination follows the Relay specification
  // Passing the value of both first and last is STRONGLY DISCOURAGED as it leads to confusing results

  let allTagUsers: Interface_TagUser[];

  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    allTagUsers = await TagUser.find({
      tagId: {
        $gt: args.after,
      },
      userId: parent._id,
    })
      .sort({ tagId: 1 })
      .populate("tagId")
      .lean();

    hasPreviousPage = await TagUser.exists({
      tagId: {
        $lte: args.after,
      },
      userId: parent._id,
    });
  } else if (args.before) {
    allTagUsers = await TagUser.find({
      tagId: {
        $lte: args.before,
      },
      userId: parent._id,
    })
      .sort({ tagId: 1 })
      .populate("tagId")
      .lean();

    hasNextPage = await TagUser.exists({
      tagId: {
        $gt: args.before,
      },
      userId: parent._id,
    });
  } else {
    allTagUsers = await TagUser.find({
      userId: parent._id,
    })
      .sort({ tagId: 1 })
      .populate("tagId")
      .lean();
  }

  let edges = allTagUsers
    .map((tagAssign) => ({
      // Here the tagId is actually the tag object after population
      node: tagAssign.tagId,
      cursor: tagAssign.tagId._id,
    }))
    // Filter out the objects that belongs to the particular organization
    .filter(
      (tagEdge) =>
        tagEdge.node.organizationId.toString() ===
        args.organizationId.toString()
    );

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
