import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { removeSampleOrganization as removeSampleOrgUtil } from "../../utilities/removeSampleOrganizationUtil";
import { SampleData, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

export const removeSampleOrganization: MutationResolvers["removeSampleOrganization"] =
  async (_parent, _args, _context) => {
    const currentUser = await User.findOne({
      _id: _context.userId,
    }).lean();

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    if (
      !(
        currentUser.userType === "SUPERADMIN" ||
        currentUser.userType === "ADMIN"
      )
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const existingOrganization = await SampleData.findOne({
      collectionName: "Organization",
    });

    if (!existingOrganization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    try {
      await removeSampleOrgUtil();
      return true;
    } catch (error) {
      console.error("Error removing generated sample data:", error);
      return false;
    }
  };
