import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import {
  OrganizationTagUser,
  InterfaceOrganizationTagUser,
} from "../../models";
import { createGraphQLConnection } from "../../utilities/graphqlConnectionFactory";

// @ts-ignore
export const childTags: UserTagResolvers["childTags"] = async (
  parent,
  args
) => {
  return await createGraphQLConnection<
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
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
