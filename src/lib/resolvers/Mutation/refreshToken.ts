import jwt from "jsonwebtoken";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { createAccessToken, createRefreshToken } from "../../utilities";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
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
          message:
            IN_PRODUCTION !== true
              ? "Invalid refreshToken"
              : requestContext.translate("invalid.refreshToken"),
          code: "invalid.refreshToken",
          param: "refreshToken",
        },
      ],
      IN_PRODUCTION !== true
        ? "Invalid refreshToken"
        : requestContext.translate("invalid.refreshToken")
    );
  }

  const jwtPayload: Interface_JwtTokenPayload = jwt.verify(
    args.refreshToken,
    process.env.REFRESH_TOKEN_SECRET!
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
              ? "Invalid refreshToken"
              : requestContext.translate("invalid.refreshToken"),
          code: "invalid.refreshToken",
          param: "refreshToken",
        },
      ],
      IN_PRODUCTION !== true
        ? "Invalid refreshToken"
        : requestContext.translate("invalid.refreshToken")
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
