import jwt from "jsonwebtoken";
import {
  INVALID_REFRESH_TOKEN_ERROR,
  REFRESH_TOKEN_SECRET,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceJwtTokenPayload } from "../../utilities";
import {
  createAccessToken,
  createRefreshToken,
  revokeRefreshToken,
} from "../../utilities";

/**
 * This function creates a new access and refresh token.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns New access and refresh tokens.
 */
export const refreshToken: MutationResolvers["refreshToken"] = async (
  _parent,
  args,
) => {
  // This route should not be protected because the access token will be expired.
  if (!args.refreshToken || typeof args.refreshToken !== "string") {
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(
            INVALID_REFRESH_TOKEN_ERROR.MESSAGE,
          ),
          code: INVALID_REFRESH_TOKEN_ERROR.CODE,
          param: INVALID_REFRESH_TOKEN_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_ERROR.MESSAGE),
    );
  }

  const jwtPayload: InterfaceJwtTokenPayload = jwt.verify(
    args.refreshToken,
    REFRESH_TOKEN_SECRET as string,
  ) as InterfaceJwtTokenPayload;

  // The refresh token received is valid so we can send a new access token
  const user = await User.findOne({
    _id: jwtPayload.userId,
  }).lean();

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const appUserProfile = await AppUserProfile.findOne({
    userId: user._id,
  }).lean();
  if (!appUserProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  if (
    appUserProfile.tokenVersion !== jwtPayload.tokenVersion &&
    appUserProfile.token !== args.refreshToken
  ) {
    await revokeRefreshToken(jwtPayload.userId);
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(
            INVALID_REFRESH_TOKEN_ERROR.MESSAGE,
          ),
          code: INVALID_REFRESH_TOKEN_ERROR.CODE,
          param: INVALID_REFRESH_TOKEN_ERROR.PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_ERROR.MESSAGE),
    );
  }

  // send new access and refresh token to user
  const newAccessToken = await createAccessToken(
    user,
    appUserProfile as InterfaceAppUserProfile,
  );
  const newRefreshToken = await createRefreshToken(
    user,
    appUserProfile as InterfaceAppUserProfile,
  );

  //update the token version for the user
  const filter = { userId: jwtPayload.userId };
  const update = {
    $set: {
      token: newRefreshToken,
    },
    $inc: { tokenVersion: 1 },
  };

  await AppUserProfile.findOneAndUpdate(filter, update, {
    new: true,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
