import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import {
  Interface_OrganizationTagUser,
  OrganizationTagUser,
} from "../../models";

// @ts-ignore
export const childTags: UserTagResolvers["childTags"] = async (
  parent,
  args
) => {
  let allChildTags: Interface_OrganizationTagUser[] = [];

  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    allChildTags = await OrganizationTagUser.find({
      _id: {
        $gt: args.after,
      },
      parentTagId: parent._id,
    })
      .sort({ _id: 1 })
      .lean();

    hasPreviousPage = await OrganizationTagUser.exists({
      _id: {
        $lte: args.after,
      },
      parentTagId: parent._id,
    });
  } else if (args.before) {
    allChildTags = await OrganizationTagUser.find({
      _id: {
        $lt: args.before,
      },
      parentTagId: parent._id,
    })
      .sort({ _id: 1 })
      .lean();

    hasNextPage = await OrganizationTagUser.exists({
      _id: {
        $gte: args.before,
      },
      parentTagId: parent._id,
    });
  } else {
    allChildTags = await OrganizationTagUser.find({
      parentTagId: parent._id,
    })
      .sort({ _id: 1 })
      .lean();
  }

  let edges = allChildTags.map((childTag) => ({
    node: childTag,
    cursor: childTag._id,
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
