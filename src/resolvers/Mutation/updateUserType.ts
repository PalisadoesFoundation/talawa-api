import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities";

export const updateUserType: MutationResolvers["updateUserType"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["userType"])
    .lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  superAdminCheck(currentUser);

  const userExists = await User.exists({
    _id: args.data.id!,
  });

  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  await User.updateOne(
    {
      _id: args.data.id!,
    },
    {
      userType: args.data.userType!,
      adminApproved: true,
    }
  );

  return true;
};
