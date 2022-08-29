import { UnauthorizedError } from '../libraries/errors';
import requestContext from '../libraries/request-context';

export const superAdminCheck = (context: any, user: any) => {
  const isSuperAdmin = user.userType === 'SUPERADMIN';

  if (!isSuperAdmin) {
    throw new UnauthorizedError(
      process.env.NODE_ENV !== 'production'
        ? 'User is not authorized for performing this operation'
        : requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }
};
