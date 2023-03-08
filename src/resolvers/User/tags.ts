import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { Tag } from "../../models";

export const tags: UserResolvers["tags"] = async (
  parent,
  { organizationId }
) => {
  const allTags = await Tag.find({
    organization: organizationId,
  }).lean();

  return allTags
    .filter((tag) =>
      tag.users.some((user) => user._id.toString() === parent._id.toString())
    )
    .map((tag) => tag.title);
};
