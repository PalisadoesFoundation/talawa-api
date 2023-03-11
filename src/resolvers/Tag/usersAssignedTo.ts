import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { TagAssign, User } from "../../models";

export const usersAssignedTo: TagResolvers["usersAssignedTo"] = async (
  parent
) => {
  const allUsers = await TagAssign.find({
    tagId: parent._id,
    objectType: "USER",
  })
    .select({
      objectId: 1,
    })
    .lean();

  const allUserIds = allUsers.map((user) => user.objectId);

  return await User.find({
    _id: {
      $in: allUserIds,
    },
  });
};
