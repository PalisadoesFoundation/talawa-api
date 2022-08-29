import { UnauthorizedError } from '../libraries/errors';
import requestContext from '../libraries/request-context';
import {
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  IN_PRODUCTION,
} from '../../constants';

export const creatorCheck = (context: any, org: any) => {
  const isCreator = String(org.creator) === context.userId;

  if (!isCreator) {
    throw new UnauthorizedError(
      !IN_PRODUCTION
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};
