import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { comments } from "./comments";
import { creator } from "./creator";

export const Post: PostResolvers = {
  comments,
  creator,
};
