import UserCustomData from "../../models/UserCustomData";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  CUSTOM_DATA_NOT_FOUND,
} from "../../constants";

export const removeUserCustomData: MutationResolvers["removeUserCustomData"] =
  async (_parent, args, context) => {
    const { organizationId } = args;

    const currentUser = await User.findOne({
      _id: "64378abd85008f171cf2990d",
    }).lean();

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

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

    const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
      (organization) => organization.equals(organization._id)
    );

    if (
      !(currentUserIsOrganizationAdmin || currentUser.userType === "SUPERADMIN")
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const userCustomData = await UserCustomData.findOneAndDelete({
      userId: context.userId,
      organizationId,
    }).lean();

    if (!userCustomData) {
      throw new errors.NotFoundError(
        requestContext.translate(CUSTOM_DATA_NOT_FOUND.MESSAGE),
        CUSTOM_DATA_NOT_FOUND.CODE,
        CUSTOM_DATA_NOT_FOUND.PARAM
      );
    }

    return userCustomData;
  };
