import type { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";

export const Comment: CommentResolvers = {
  createdBy,
};
