import jwt from "jsonwebtoken";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { createAccessToken, createRefreshToken } from "../../utilities";
import {
  INVALID_REFRESH_TOKEN,
  INVALID_REFRESH_TOKEN_CODE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  INVALID_REFRESH_TOKEN_PARAM,
  IN_PRODUCTION,
  REFRESH_TOKEN_SECRET,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { Interface_JwtTokenPayload } from "../../utilities";

export const refreshToken: MutationResolvers["refreshToken"] = async (
  _parent,
  args
) => {
  // This route should not be protected because the access token will be expired.
  if (!args.refreshToken) {
    throw new errors.ValidationError(
      [
        {
          message:
            IN_PRODUCTION !== true
              ? INVALID_REFRESH_TOKEN
              : requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE),
          code: INVALID_REFRESH_TOKEN_CODE,
          param: INVALID_REFRESH_TOKEN_PARAM,
        },
      ],
      IN_PRODUCTION !== true
        ? INVALID_REFRESH_TOKEN
        : requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE)
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  if (user.tokenVersion !== jwtPayload.tokenVersion) {
    throw new errors.ValidationError(
      [
        {
          message:
            IN_PRODUCTION !== true
              ? INVALID_REFRESH_TOKEN
              : requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE),
          code: INVALID_REFRESH_TOKEN_CODE,
          param: INVALID_REFRESH_TOKEN_PARAM,
        },
      ],
      IN_PRODUCTION !== true
        ? INVALID_REFRESH_TOKEN
        : requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE)
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
