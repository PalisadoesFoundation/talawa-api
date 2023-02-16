import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { User } from "../../models";
import { errors } from "../../libraries";

export const checkAuth: QueryResolvers["checkAuth"] = async (
  _parent,
  _args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND,
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return {
    ...currentUser,
    organizationsBlockedBy: [],
  };
};
