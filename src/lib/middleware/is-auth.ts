import jwt from 'jsonwebtoken';
import { Request } from 'express';
import logger from '../libraries/logger';

/*
This interface represents the type of data object returned by isAuth function.
There's one gotcha to this. Instead of using a falsy value like 'null' or 'undefined'
we've used an empty string as the default value for userId so that inside resolvers when we
are making use of userId typescript doesn't complain that userId could be a falsy
value(null, undefined etc.). But userId must never be used directly. Always make
sure to rely on isAuth boolean for identifying whether the current user is
authenticated or not. If isAuth is true only then we are free to make use of userId.
*/
export interface IAuthData {
  isAuth: boolean;
  expired: boolean | undefined;
  userId: string;
}

export const isAuth = (req: Request) => {
  /*
  This object is the return value of this function. Mutate the fields of this
  object conditionally as the authentication flow continues and return it from
  the function whereever needed.
  */
  const authData: IAuthData = {
    isAuth: false,
    expired: undefined,
    userId: '',
  };

  // This checks to see if there is an authorization field within the incoming request
  const authHeader = req.headers.authorization;

  // If no authorization header was sent from the client
  if (!authHeader) {
    return authData;
  }

  // format of request sent will be Bearer tokenvalue
  // this splits it into two values bearer and the token
  const token = authHeader.split(' ')[1];

  // if the token is null or an empty string
  if (!token || token === '') {
    return authData;
  }
  // uses key created in the auth resolver
  // to be changed in production
  // only tokens created with this key will be valid tokens
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      (err, decoded) => {
        if (err) {
          return err;
        }

        return decoded;
      }
    ); // If there is an error decoded token would contain it

    if (decodedToken.name === 'TokenExpiredError') {
      // If the token has expired set the expired field of authData to true and return it
      authData.expired = true;
      return authData;
    }
  } catch (e) {
    authData.expired = true;
    return authData;
  }

  // if the decoded token is not set
  if (!decodedToken) {
    logger.info('decoded token is not present');
    return authData;
  }

  // shows the user is an authenticated user
  authData.isAuth = true;
  // pulls user data(userId) out of the token and attaches it to userId field of authData object
  authData.userId = decodedToken.userId;

  return authData;
};
