import { Types } from "mongoose";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, SampleData, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { removeSampleOrganization as removeSampleOrgUtil } from "../../utilities/removeSampleOrganizationUtil";

export const removeSampleOrganization: MutationResolvers["removeSampleOrganization"] =
  async (_parent, _args, _context) => {
    const currentUser = await User.findOne({
      _id: _context.userId,
    }).lean();

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const existingOrganization = await SampleData.findOne({
      collectionName: "Organization",
    });

    if (!existingOrganization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentUserOrgAdmin = currentUserAppProfile.adminFor.some(
      (org) =>
        org &&
        new Types.ObjectId(org.toString()).equals(
          existingOrganization.documentId,
        ),
    );

    if (!currentUserAppProfile.isSuperAdmin && !currentUserOrgAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await removeSampleOrgUtil();
    return true;
  };
