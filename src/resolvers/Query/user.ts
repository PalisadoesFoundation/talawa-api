import {
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { User } from "../../models";

export const user: QueryResolvers["user"] = async (_parent, args, context) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND,
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const user = await User.findOne({
    _id: args.id,
  })
    .populate("adminFor")
    .lean();

  // This Query field doesn't allow client to see organizations they are blocked by
  return {
    ...user!,
    organizationsBlockedBy: [],
  };
};
