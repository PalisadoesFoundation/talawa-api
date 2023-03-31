import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, Interface_TagUser, Interface_User } from "../../models";
import { createGraphQLConnection } from "../../utilities/graphqlConnectionFactory";

// @ts-ignore
export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  return await createGraphQLConnection<Interface_User, Interface_TagUser>(
    args,
    TagUser,
    "_id",
    {
      tagId: parent._id,
    },
    "userId",
    (result) => result.userId,
    (result) => result._id.toString()
  );
};
