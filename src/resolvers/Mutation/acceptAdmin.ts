import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities/superAdminCheck";

export const acceptAdmin: MutationResolvers["acceptAdmin"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  superAdminCheck(currentUser!);

  await User.updateOne(
    {
      _id: args.id,
    },
    {
      $set: {
        adminApproved: true,
      },
    }
  );

  return true;
};
