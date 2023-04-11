import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import {
  OrganizationTagUser,
  Interface_OrganizationTagUser,
} from "../../models";
import { createGraphQLConnection } from "../../utilities/graphqlConnectionFactory";

// @ts-ignore
export const childTags: UserTagResolvers["childTags"] = async (
  parent,
  args
) => {
  return await createGraphQLConnection<
    Interface_OrganizationTagUser,
    Interface_OrganizationTagUser
  >(
    args,
    OrganizationTagUser,
    {
      parentTagId: parent._id,
    },
    {
      name: 1,
    },
    null,
    (result) => result
  );
};
