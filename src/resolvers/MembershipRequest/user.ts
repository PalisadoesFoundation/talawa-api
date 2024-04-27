import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver function will retrieve and return the user who sent the membership request from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const user: MembershipRequestResolvers["user"] = async (parent) => {
  const result = await User.findOne({
    _id: parent.user,
  }).lean();

  if (result) {
    return result;
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
};
