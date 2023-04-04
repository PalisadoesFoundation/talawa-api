import { Types } from "mongoose";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization } from "../../models";

/**
 * Throws error if there exists no `Organization` with the given `id` else returns macthing `Organization` document
 * @param organizationId - `id` of the desried organization
 */
export const getValidOrganizationById = async (
  organizationId: string | Types.ObjectId
) => {
  const organization = await Organization.findOne({
    _id: organizationId,
  }).lean();

  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  return organization;
};
