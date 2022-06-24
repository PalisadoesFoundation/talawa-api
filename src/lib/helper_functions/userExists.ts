import { User } from '../models';
import { NotFoundError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from '../../constants';

export const userExists = async (id: string) => {
  const user = await User.findOne({ _id: id });

  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return user;
};

export default userExists;
