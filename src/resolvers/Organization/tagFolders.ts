import { TagFolder } from "../../models";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const tagFolders: OrganizationResolvers["tagFolders"] = async (
  parent
) => {
  return await TagFolder.find({
    parent: null,
    organization: parent._id,
  }).lean();
};
