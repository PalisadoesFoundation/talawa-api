import "dotenv/config";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities/userFamilyAdminCheck";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import { UserFamily } from "../../models/userFamily";
import type { InterfaceUserFamily } from "../../models/userFamily";
import {
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";

/**
 * Adds a user to a user family.
 *
 * This function allows an admin to add a user to a specific user family. It performs several checks:
 *
 * 1. Verifies if the user family exists.
 * 2. Checks if the user exists.
 * 3. Confirms that the user is not already a member of the family.
 * 4. Ensures that the current user is an admin of the user family.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `familyId`: The ID of the user family to which the user will be added.
 *   - `userId`: The ID of the user to be added to the user family.
 * @param context - The context of the entire application, including user information and other context-specific data.
 *
 * @returns A promise that resolves to the updated user family object.
 *
 */
export const addUserToUserFamily: MutationResolvers["addUserToUserFamily"] =
  async (_parent, args, context) => {
    const userFamily = await UserFamily.findOne({
      _id: args.familyId,
    }).lean();

    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }
    // Checks whether user with _id === args.userId exists.
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check whether family exists.
    if (!userFamily) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE),
        USER_FAMILY_NOT_FOUND_ERROR.CODE,
        USER_FAMILY_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check whether user is an admin of the family.
    await adminCheck(currentUser?._id, userFamily);

    const isUserMemberOfUserFamily = userFamily.users.some((user) =>
      user.equals(args.userId),
    );

    // Checks whether user with _id === args.userId is already a member of the family.
    if (isUserMemberOfUserFamily) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM,
      );
    }

    // Adds args.userId to the users list in the user family and returns the updated family.
    const updatedFamily = await UserFamily.findOneAndUpdate(
      {
        _id: args.familyId,
      },
      {
        $push: {
          users: args.userId,
        },
      },
      {
        new: true,
      },
    ).lean();

    return updatedFamily as InterfaceUserFamily;
  };
