import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, User } from "../../models";

export const usersAssignedTo: TagResolvers["usersAssignedTo"] = async (
  parent
) => {
  const allUsers = await TagUser.find({
    tagId: parent._id,
    objectType: "USER",
  })
    .select({
      userId: 1,
    })
    .lean();

  const allUserIds = allUsers.map((user) => user.userId);

  return await User.find({
    _id: {
      $in: allUserIds,
    },
  });
};
