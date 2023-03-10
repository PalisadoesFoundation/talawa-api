import { Tag } from "../../models";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const rootTags: OrganizationResolvers["rootTags"] = async (parent) => {
  return await Tag.find({
    parentTagId: null,
    organizationId: parent._id,
  }).lean();
};
