import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Comment } from "../../models";

/**
 * This query fetch the all existing comments from database.
 * @returns An object that contains the list of comments.
 */
export const comments: QueryResolvers["comments"] = async () => {
  return await Comment.find()
    .populate("creator", "-password")
    .populate("post")
    .populate("likedBy")
    .lean();
};
