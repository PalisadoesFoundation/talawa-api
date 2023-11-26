import { UserCustomData } from "../../models/UserCustomData";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This query will fetch all the customData of the members of the organization in the database.
 * @param _parent-
 * @param args - An object that contains `id` of the organization.
 * @returns An object `customDatas` that contains all the custom fields of the specified organization.
 * The following checks are made:
 *  1. if the organization exists
 */

export const customDataByOrganization: QueryResolvers["customDataByOrganization"] =
  async (_parent, args) => {
    const { organizationId } = args;

    const customData = await UserCustomData.find({
      organizationId,
    }).lean();

    return customData;
  };
