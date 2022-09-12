import { errors, requestContext } from '../libraries';
import {
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  IN_PRODUCTION,
} from '../../constants';
import { Types } from 'mongoose';
import { Interface_Organization } from '../models';

export const creatorCheck = (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsCreator = userId.toString() === organization.creator.toString();

  if (userIsCreator === false) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};
