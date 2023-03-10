import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { UserTag } from "../../models";

export const assignedUsers: TagResolvers["assignedUsers"] = async (parent) => {
  const allUserTags = await UserTag.find({
    tagId: parent._id,
  })
    .select({
      userId: 1,
    })
    .populate("userId")
    .lean();

  // Return a user array, built by mapping the userTag's populated with the userId
  // to their userId property
  return allUserTags.map((userTag) => userTag.userId);
};
