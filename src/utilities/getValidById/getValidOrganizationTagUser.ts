import { Types } from "mongoose";
import { TAG_NOT_FOUND } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { OrganizationTagUser } from "../../models";

/**
 * Throws error if there exists no `OrganizationTagUser` with the given `id` else returns matching `OrganizationTagUser` document
 * @param organizationTagUserId - `id` of the desried organization tag user
 */
export const getValidOrganizationTagUserById = async (
  organizationTagUserId: string | Types.ObjectId
) => {
  const organizationTagUser = await OrganizationTagUser.findOne({
    _id: organizationTagUserId,
  }).lean();

  if (!organizationTagUser) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }

  return organizationTagUser;
};
