import { BASE_URL } from "../../constants";
import { Organization } from "../../models/Organization";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const image: OrganizationResolvers["image"] = async (parent) => {
  const org = await Organization.findOne({
    _id: parent._id,
  });
  if (org!.image) {
    return `${BASE_URL}${org!.image}`;
  }
  return null;
};
