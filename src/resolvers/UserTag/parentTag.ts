import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { OrganizationTagUser } from "../../models";

export const parentTag: UserTagResolvers["parentTag"] = async (parent) => {
  return await OrganizationTagUser.findOne({
    _id: parent!.parentTagId,
  }).lean();
};
