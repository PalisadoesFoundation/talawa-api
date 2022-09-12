import { MutationResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from '../../../constants';
import { errors, requestContext } from '../../libraries';

export const rejectAdmin: MutationResolvers['rejectAdmin'] = async (
  _parent,
  args,
  context
) => {
  let currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser is not a SUPERADMIN.
  if (currentUser.userType !== 'SUPERADMIN') {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  const userExists = await User.exists({
    _id: args.id,
  });

  // Checks whether user with _id === args.id exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Deletes the user.
  await User.deleteOne({
    _id: args.id,
  });

  // Returns true if operation is successful.
  return true;
};
