import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { OrganizationTagUser } from "../../models";

export const parentTag: UserTagResolvers["parentTag"] = async (parent) => {
  const tag = await OrganizationTagUser.findOne({
    _id: parent._id,
  }).lean();

  return await OrganizationTagUser.findOne({
    _id: tag!.parentTagId,
  }).lean();
};
