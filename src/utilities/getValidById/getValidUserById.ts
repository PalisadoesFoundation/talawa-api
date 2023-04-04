import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";

/**
 * Throws error if there exists no `User` with the given `id` else returns matching `User` document
 * @param userId - `id` of the desried user
 */
export const getValidUserById = async (userId: string | Types.ObjectId) => {
  const user = await User.findOne({
    _id: userId,
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
