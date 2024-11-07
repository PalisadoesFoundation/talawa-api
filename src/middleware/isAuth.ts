import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, UNAUTHENTICATED_ERROR } from "../constants";
import { logger, requestContext } from "../libraries";

// This interface represents the type of data object returned by isAuth function.
export interface InterfaceAuthData {
  isAuth: boolean;
  expired: boolean | undefined;
  userId: string | undefined;
}

/**
 * This function determines whether the user is authorised and whether the access token has expired.
 * @param request - User Request object from Express.
 * @returns Returns `authData` object with `isAuth`, `expired` and `userId` properties.
 */
export const isAuth = (request: Request): InterfaceAuthData => {
  // Initialize authData object with default values
  const authData: InterfaceAuthData = {
    isAuth: false,
    expired: undefined,
    userId: undefined,
  };

  // Retrieve authorization header from request
  const authHeader = request.headers.authorization;

  // If no authorization header is present, return default authData
  if (!authHeader) {
    return authData;
  }

  // Extract token from authorization header
  const token = authHeader.split(" ")[1];

  // If token is missing or empty, return default authData
  if (!token || token === "") {
    return authData;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET as string,
      (err, decoded) => {
        if (err) {
          return err;
        }
        return decoded;
      },
    ); // If there is an error decoded token would contain it

    if (decodedToken.name === "TokenExpiredError") {
      // If the token has expired set the expired field of authData to true and return it
      authData.expired = true;
      return authData;
    }
  } catch (err) {
    logger.error(err);
    authData.expired = true;
    return authData;
  }

  // If decoded token is not set, log an info message and return default authData
  if (!decodedToken) {
    logger.info("decoded token is not present");
    return authData;
  }

  // Set isAuth to true and extract userId from decoded token
  authData.isAuth = true;
  authData.userId = decodedToken.userId;

  // Return the finalized authData object
  return authData;
};

// Extend the Express Request interface locally
export interface InterfaceAuthenticatedRequest extends Request {
  isAuth?: boolean;
  userId?: string;
  tokenExpired?: boolean;
}

/**
 * Middleware for REST APIs to authenticate users based on the JWT token in the Authorization header.
 *
 * This middleware checks if the incoming request has a valid JWT token. It sets the authentication
 * status, user ID, and token expiration status on the `req` object for downstream middleware and
 * route handlers to use.
 *
 * @param req - The incoming request object. The JWT token is expected in the `Authorization` header.
 * @param res - The response object. If authentication fails, an HTTP 401 response will be sent.
 * @param next - The next middleware function in the stack. It is called if the user is authenticated.
 *
 * @returns Returns a 401 Unauthorized response if the user is not authenticated or the token has expired.
 *
 * @example
 * ```typescript
 * app.use("/api/protected-route", isAuthMiddleware, (req, res) => {
 *   if (req.isAuth) {
 *     res.json({ message: "This is a protected route" });
 *   }
 * });
 * ```
 */
export const isAuthMiddleware = (
  req: InterfaceAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authData: InterfaceAuthData = isAuth(req);
  req.isAuth = authData.isAuth;
  req.userId = authData.userId;
  req.tokenExpired = authData.expired;

  if (!authData.isAuth) {
    res.status(401).json({
      message: requestContext.translate(UNAUTHENTICATED_ERROR.MESSAGE),
      expired: authData.expired,
    });
    return;
  }

  next();
};
