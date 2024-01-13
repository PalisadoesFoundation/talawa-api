import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * This query will fetch the list of all post within an Organization from database.
 * @param _parent-
 * @param args - An object that contains `id` of the organization, `orderBy` fields.
 * @returns An object that contains the Post.
 */

export const venuesInOrganization: QueryResolvers["venuesInOrganization"] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.id,
    })
      .populate("venues")
      .lean();

    return organization?.venues || [];
  };
