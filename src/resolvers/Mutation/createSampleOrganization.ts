import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  SAMPLE_ORGANIZATION_ALREADY_EXISTS,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { createSampleOrganization as createSampleOrgUtil } from "../../utilities/createSampleOrganizationUtil";
import { SampleData, User } from "../../models";

/**
 * Generates sample data for testing or development purposes.
 * @returns True if the sample data generation is successful, false otherwise.
 */
export const createSampleOrganization: MutationResolvers["createSampleOrganization"] =
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

    if (existingOrganization) {
      throw new errors.UnauthorizedError(
        requestContext.translate(SAMPLE_ORGANIZATION_ALREADY_EXISTS.MESSAGE),
        SAMPLE_ORGANIZATION_ALREADY_EXISTS.CODE,
        SAMPLE_ORGANIZATION_ALREADY_EXISTS.PARAM
      );
    }

    await createSampleOrgUtil();
    return true;
  };
