import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser } from "../../models";
import { errors } from "../../libraries";
import {
  PAGINATION_FIRST_CANT_BE_NEGATIVE_ERROR,
  PAGINATION_LAST_CANT_BE_NEGATIVE_ERROR,
} from "../../constants";

export const tagsAssignedWith: UserResolvers["tagsAssignedWith"] = async (
  parent,
  args
) => {
  // This pagination follows the Relay specification
  // Passing the value of both first and last is STRONGLY DISCOURAGED as it leads to confusing results

  const allTagUsers = await TagUser.find({
    // @ts-ignore
    _id: {
      $gt: args.after,
      $lte: args.before,
    },
    objectId: parent._id,
    objectType: "USER",
  })
    .populate("tagId")
    .lean();

  let edges = allTagUsers.map((tagAssign) => ({
    node: tagAssign.tagId,
    cursor: tagAssign.tagId._id,
  }));

  let hasNextPage = false,
    hasPreviousPage = false;

  if (args.after) {
    hasNextPage = edges.length > (args.first || 0);
    hasPreviousPage = await TagUser.exists({
      _id: {
        $lt: args.after,
      },
      objectId: parent._id,
      objectType: "USER",
    });
  }

  if (args.last) {
    // @ts-ignore
    hasNextPage = await TagUser.exists({
      _id: {
        // @ts-ignore
        $gte: args.before,
      },
      objectId: parent._id,
      objectType: "USER",
    });
    hasPreviousPage = edges.length > (args.last || 0);
  }

  if (args.first) {
    if (args.first < 0) {
      throw new errors.InputValidationError(
        PAGINATION_FIRST_CANT_BE_NEGATIVE_ERROR.MESSAGE,
        PAGINATION_FIRST_CANT_BE_NEGATIVE_ERROR.CODE,
        PAGINATION_FIRST_CANT_BE_NEGATIVE_ERROR.PARAM
      );
    }
    if (edges.length > args.first) {
      edges = edges.slice(0, args.first);
    }
  }

  if (args.last) {
    if (args.last < 0) {
      throw new errors.InputValidationError(
        PAGINATION_LAST_CANT_BE_NEGATIVE_ERROR.MESSAGE,
        PAGINATION_LAST_CANT_BE_NEGATIVE_ERROR.CODE,
        PAGINATION_LAST_CANT_BE_NEGATIVE_ERROR.PARAM
      );
    }
    if (edges.length > args.last) {
      edges = edges.slice(-args.last, 0);
    }
  }

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
    },
  };
};
