import bcrypt from "bcryptjs";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

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
    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    });
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }
    const isPasswordValid = await bcrypt.compare(
      args.data.previousPassword,
      currentUser?.password || ""
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
        },
      },
      {
        new: true,
      }
    );
    const updatedAppUserProfile: InterfaceAppUserProfile =
      await AppUserProfile.findOneAndUpdate(
        {
          userId: context.userId,
        },
        {
          $set: {
            token: null,
          },
        },
        {
          new: true,
        }
      ).lean();
    if (!updatedAppUserProfile) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    return {
      user: updatedUser as InterfaceUser,
      appUserProfile: {
        _id: updatedAppUserProfile._id.toString(),
        userId: updatedAppUserProfile.userId as InterfaceUser,
        adminFor: updatedAppUserProfile.adminFor as InterfaceOrganization[],
        appLanguageCode: updatedAppUserProfile.appLanguageCode,
        isSuperAdmin: updatedAppUserProfile.isSuperAdmin,
        pluginCreationAllowed: updatedAppUserProfile.pluginCreationAllowed,
        tokenVersion: updatedAppUserProfile.tokenVersion,
        eventAdmin: updatedAppUserProfile.eventAdmin as InterfaceEvent[],
        createdEvents: updatedAppUserProfile.createdEvents as InterfaceEvent[],
        createdOrganizations:
          updatedAppUserProfile.createdOrganizations as InterfaceOrganization[],
      },
    };
  };
