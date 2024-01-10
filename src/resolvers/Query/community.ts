import {
  COMMUNITY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Community, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";

/**
 * This query will fetch the community data from the database.
 * @param _parent-
 * @param args -
 * @returns A `community` object. If the `community` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */

export const community: QueryResolvers["community"] = async (
  _parent,
  args,
  context
) => {
  const userId = context.userId;
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  superAdminCheck(user);

  const community = await Community.findOne().lean();

  if (!community) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMUNITY_NOT_FOUND_ERROR.MESSAGE),
      COMMUNITY_NOT_FOUND_ERROR.CODE,
      COMMUNITY_NOT_FOUND_ERROR.PARAM
    );
  }

  return {
    ...community,
    _id: community._id.toString(),
    image: community?.image ? `${context.apiRootUrl}${community?.image}` : null,
  };
};
