import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { UserTag } from "../../models";

export const assignedUsers: TagResolvers["assignedUsers"] = async (parent) => {
  const allUserTags = await UserTag.find({
    tag: parent._id,
  })
    .select({
      user: 1,
    })
    .sort({
      createdAt: 1,
    })
    .populate("user")
    .lean();

  // Return a user array, built by mapping the userTag's populated with the userId
  // to their userId property
  return allUserTags.map((userTag) => userTag.user);
};
