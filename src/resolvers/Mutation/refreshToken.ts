import jwt from "jsonwebtoken";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { createAccessToken, createRefreshToken } from "../../utilities";
import {
  INVALID_REFRESH_TOKEN_ERROR,
  REFRESH_TOKEN_SECRET,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { Interface_JwtTokenPayload } from "../../utilities";
/**
 * This function creates a new access and refresh token.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns New access and refresh tokens.
 */
export const refreshToken: MutationResolvers["refreshToken"] = async (
  _parent,
  args
) => {
  // This route should not be protected because the access token will be expired.
  if (!args.refreshToken) {
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(
            INVALID_REFRESH_TOKEN_ERROR.MESSAGE
          ),
          code: INVALID_REFRESH_TOKEN_ERROR.CODE,
          param: INVALID_REFRESH_TOKEN_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_ERROR.MESSAGE)
    );
  }

  const jwtPayload: Interface_JwtTokenPayload = jwt.verify(
    args.refreshToken,
    REFRESH_TOKEN_SECRET!
  ) as Interface_JwtTokenPayload;

  // The refresh token received is valid so we can send a new access token
  const user = await User.findOne({
    _id: jwtPayload.userId,
  }).lean();

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  if (user.tokenVersion !== jwtPayload.tokenVersion) {
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(
            INVALID_REFRESH_TOKEN_ERROR.MESSAGE
          ),
          code: INVALID_REFRESH_TOKEN_ERROR.CODE,
          param: INVALID_REFRESH_TOKEN_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_ERROR.MESSAGE)
    );
  }

  // send new access and refresh token to user
  const newAccessToken = await createAccessToken(user);
  const newRefreshToken = await createRefreshToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
