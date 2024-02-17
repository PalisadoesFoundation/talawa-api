import type { AdvertisementResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: AdvertisementResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
