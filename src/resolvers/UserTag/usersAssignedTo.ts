import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, InterfaceTagUser, InterfaceUser } from "../../models";
import { createGraphQLConnection } from "../../utilities/graphqlConnectionFactory";

// @ts-ignore
export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  return await createGraphQLConnection<InterfaceUser, InterfaceTagUser>(
    args,
    TagUser,
    {
      tagId: parent._id,
    },
    {},
    "userId",
    (result) => result.userId
  );
};
