import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { OrganizationTagUser } from "../../models";

export const parentTag: UserTagResolvers["parentTag"] = async (parent) => {
  // Check if the parentTag is null
  if (parent.parentTagId === null) return null;

  // If the parentTag is not null, make a database request to fetch the same
  return await OrganizationTagUser.findOne({
    _id: parent.parentTagId,
  }).lean();
};
