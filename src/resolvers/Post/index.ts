import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { comments } from "./comments";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";

export const Post: PostResolvers = {
  comments,
  createdBy,
  updatedBy,
};
