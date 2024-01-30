import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * This query will fetch the list of all venues within an Organization from database.
 * @param _parent-
 * @param args - An object that contains `id` of the organization.
 * @returns An object that contains the venues.
 */

export const venuesInOrganization: QueryResolvers["venuesInOrganization"] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.id,
    })
      .populate("venues")
      .lean();

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    return organization?.venues;
  };
