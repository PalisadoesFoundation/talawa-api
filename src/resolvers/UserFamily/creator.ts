import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { UserFamilyResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This resolver function will fetch and return the creator of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the creator data. If the creator not exists then throws an `NotFoundError` error.
 */
export const creator: UserFamilyResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator.toString(),
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
<<<<<<< HEAD
      USER_NOT_FOUND_ERROR.PARAM
=======
      USER_NOT_FOUND_ERROR.PARAM,
>>>>>>> 08a668823866ed5bfa7b412d358575e3a3889c71
    );
  }

  return user;
};
