import {
  INVALID_CREDENTIALS_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import bcrypt from "bcryptjs";
import { storeTransaction } from "../../utilities/storeTransaction";

export const updateUserPassword: MutationResolvers["updateUserPassword"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const isPasswordValid = await bcrypt.compare(
      args.data.previousPassword,
      currentUser.password
    );

    // Checks whether password is invalid.
    if (isPasswordValid === false) {
      throw new errors.ValidationError(
        [
          {
            message: requestContext.translate(
              INVALID_CREDENTIALS_ERROR.MESSAGE
            ),
            code: INVALID_CREDENTIALS_ERROR.CODE,
            param: INVALID_CREDENTIALS_ERROR.PARAM,
          },
        ],
        requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE)
      );
    }

    if (args.data.newPassword !== args.data.confirmNewPassword) {
      throw new errors.ValidationError(
        [
          {
            message: requestContext.translate(
              INVALID_CREDENTIALS_ERROR.MESSAGE
            ),
            code: INVALID_CREDENTIALS_ERROR.CODE,
            param: INVALID_CREDENTIALS_ERROR.PARAM,
          },
        ],
        requestContext.translate(INVALID_CREDENTIALS_ERROR.MESSAGE)
      );
    }

    const hashedPassword = await bcrypt.hash(args.data.newPassword, 12);

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: context.userId,
      },
      {
        $set: {
          password: hashedPassword,
          token: null,
        },
      },
      {
        new: true,
      }
    ).lean();
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "User",
      `User:${context.userId} updated password, token`
    );

    return updatedUser!;
  };
