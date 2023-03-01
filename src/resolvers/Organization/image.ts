import { Organization } from "../../models/Organization";
import { errors, requestContext } from "../../libraries";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,
  BASE_URL,
} from "../../constants";

export const image: OrganizationResolvers["image"] = async (parent) => {
  const org = await Organization.findOne({
    _id: parent._id,
  });
  if (!org) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_MESSAGE,
      ORGANIZATION_MEMBER_NOT_FOUND_PARAM
    );
  }
  if (org.image) {
    return `${BASE_URL}${org.image}`;
  }
  return null;
};
