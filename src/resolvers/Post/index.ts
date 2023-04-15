import { PostResolvers } from "../../types/generatedGraphQLTypes";
import { comments } from "./comments";

export const Post: PostResolvers = {
  comments,
};
