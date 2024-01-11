import jwt from "jsonwebtoken";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import type { InterfaceJwtTokenPayload } from "../../utilities";
import {
  createAccessToken,
  createRefreshToken,
  revokeRefreshToken,
} from "../../utilities";
import {
  INVALID_REFRESH_TOKEN_ERROR,
  REFRESH_TOKEN_SECRET,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { storeTransaction } from "../../utilities/storeTransaction";

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
  if (!args.refreshToken || typeof args.refreshToken !== "string") {
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

  const jwtPayload: InterfaceJwtTokenPayload = jwt.verify(
    args.refreshToken,
    REFRESH_TOKEN_SECRET as string
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
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  if (
    user.tokenVersion !== jwtPayload.tokenVersion &&
    user.token !== args.refreshToken
  ) {
    await revokeRefreshToken(jwtPayload.userId);
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

  //update the token version for the user
  const filter = { _id: jwtPayload.userId };
  const update = {
    $set: {
      token: newRefreshToken,
    },
    $inc: { tokenVersion: 1 },
  };

  await User.findOneAndUpdate(filter, update, {
    new: true,
  });

  await storeTransaction(
    jwtPayload.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${jwtPayload.userId} updated token, tokenVersion`
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
