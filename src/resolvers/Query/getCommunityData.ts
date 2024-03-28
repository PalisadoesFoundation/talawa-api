import { Community } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This query will fetch the community data from the database.
 * @returns A `community` object or if it does not exits then it will return null.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */

export const getCommunityData: QueryResolvers["getCommunityData"] =
  async () => {
    const community = await Community.findOne();

    return community;
  };
