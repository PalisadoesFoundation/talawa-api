import { MutationResolvers } from '../../../generated/graphQLTypescriptTypes';
import { errors, requestContext } from '../../libraries';
import { User } from '../../models';
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from '../../../constants';

export const saveFcmToken: MutationResolvers['saveFcmToken'] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  await User.updateOne(
    {
      _id: context.userId,
    },
    {
      $set: {
        token: args.token,
      },
    }
  );

  return true;
};
