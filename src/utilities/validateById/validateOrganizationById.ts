import { Types } from "mongoose";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization } from "../../models";

/**
 * Throws error if there exists no `Organization` with the given `id`
 * @param organizationId - `id` of the desried organization
 */
export const validateOrganizationById = async (
  organizationId: string | Types.ObjectId
) => {
  const organization = await Organization.exists({
    _id: organizationId,
  });

  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }
};
