import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { comments } from "./comments";
import { creatorId } from "./creatorId";

export const Post: PostResolvers = {
  comments,
  creatorId,
};
