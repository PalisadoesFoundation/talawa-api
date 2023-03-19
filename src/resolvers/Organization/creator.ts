import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This resolver function will fetch and return the creator of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the creator data. If the creator not exists then throws an `NotFoundError` error.
 */
export const creator: OrganizationResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return user;
};
