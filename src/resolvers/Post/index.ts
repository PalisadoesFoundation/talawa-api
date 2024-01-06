import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { comments } from "./comments";
import { createdBy } from "./createdBy";

export const Post: PostResolvers = {
  comments,
  createdBy,
};
