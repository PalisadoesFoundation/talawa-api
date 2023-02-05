import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";

export const postsByOrganization: QueryResolvers["postsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    return Post.find({
      organization: args.id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
  };
