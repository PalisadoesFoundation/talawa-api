import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import {
  Interface_OrganizationTagUser,
  OrganizationTagUser,
} from "../../models";

// @ts-ignore
export const userTags: OrganizationResolvers["userTags"] = async (
  parent,
  args
) => {
  // This pagination follows the Relay specification
  // Passing the value of both first and last is STRONGLY DISCOURAGED as it leads to confusing results

  let allTags: Interface_OrganizationTagUser[];

  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    allTags = await OrganizationTagUser.find({
      _id: {
        $gt: args.after,
      },
      organizationId: parent._id,
      parentTagId: null,
    })
      .sort({
        _id: 1,
      })
      .lean();

    hasPreviousPage = await OrganizationTagUser.exists({
      _id: {
        $lte: args.after,
      },
      organizationId: parent._id,
      parentTagId: null,
    });
  } else if (args.before) {
    allTags = await OrganizationTagUser.find({
      _id: {
        $lte: args.before,
      },
      organizationId: parent._id,
      parentTagId: null,
    })
      .sort({
        _id: 1,
      })
      .lean();

    hasNextPage = await OrganizationTagUser.exists({
      _id: {
        $gt: args.before,
      },
      organizationId: parent._id,
      parentTagId: null,
    });
  } else {
    allTags = await OrganizationTagUser.find({
      organizationId: parent._id,
      parentTagId: null,
    })
      .sort({
        _id: 1,
      })
      .lean();
  }

  let edges = allTags.map((tag) => ({
    node: tag,
    cursor: tag._id,
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
