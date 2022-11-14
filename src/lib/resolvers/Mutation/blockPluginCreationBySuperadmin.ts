import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../../constants";
/**
 * This function enables an admin to create block plugin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the user is the SUPERADMIN of organization
 * @returns Deleted updated user
 */
export const blockPluginCreationBySuperadmin: MutationResolvers["blockPluginCreationBySuperadmin"] =
  async (_parent, args, context) => {
    const userExists = await User.exists({
      _id: args.userId,
    });

    // Checks whether user with _id === args.userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    // Checks whether currentUser is a SUPERADMIN.
    const currentUserIsSuperAdmin = currentUser.userType === "SUPERADMIN";

    if (currentUserIsSuperAdmin === false) {
      throw new errors.UnauthorizedError(
        IN_PRODUCTION !== true
          ? USER_NOT_AUTHORIZED
          : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
        USER_NOT_AUTHORIZED_CODE,
        USER_NOT_AUTHORIZED_PARAM
      );
    }

    /*
    Sets pluginCreationAllowed field on document of user with _id === args.userId
    to !args.blockUser and returns the updated user.
    */
    return await User.findOneAndUpdate(
      {
        _id: args.userId,
      },
      {
        $set: {
          pluginCreationAllowed: !args.blockUser,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
