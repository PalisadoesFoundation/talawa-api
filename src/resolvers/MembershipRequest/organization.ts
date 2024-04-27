import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver function will get and return the organisation from the database for which a membership request was sent.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the Organization data.
 */
export const organization: MembershipRequestResolvers["organization"] = async (
  parent,
) => {
  const result = await Organization.findOne({
    _id: parent.organization,
  }).lean();

  if (result) {
    return result;
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
};
