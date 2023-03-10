import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { UserTag } from "../../models";

export const tags: UserResolvers["tags"] = async (
  parent,
  { organizationId }
) => {
  // Get all the tags that the user has been assigned
  const allTags = await UserTag.find({
    userId: parent._id,
  })
    .populate("tagId")
    .lean();

  // Get all the tags that belong to the particular organization
  return allTags
    .map((tag) => tag.tag)
    .filter((tag) => tag.organization.toString() === organizationId);
};
