// Assuming you have the necessary imports for types and libraries

import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";

export const getOrganizationTimeout: QueryResolvers["getOrganizationTimeout"] =
  async (_parent, args, context) => {
    const userId = context.userId;
    const user = await User.findById(userId).lean();
    const organization = await Organization.findById(args.id).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    adminCheck(userId, organization);

    return organization?.timeout || 0;
  };
