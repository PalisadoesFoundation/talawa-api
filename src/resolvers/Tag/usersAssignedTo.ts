import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser } from "../../models";

export const usersAssignedTo: TagResolvers["usersAssignedTo"] = async (
  parent
) => {
  const allTagUsers = await TagUser.find({
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
  return allTagUsers.map((userTag) => userTag.user);
};
