import {
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type { InterfaceUserFamily } from "../../models/userFamily";
import { UserFamily } from "../../models/userFamily";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities/userFamilyAdminCheck";
import mongoose from "mongoose";
/**
 * This function enables to remove a user from group chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire publication
 * @remarks The following checks are done:
 * 1. If the family exists.
 * 2. If the user to be removed is member of the organisation.
 * 3. If the user is admin of the family
 * @returns Updated group chat.
 */
export const removeUserFromUserFamily: MutationResolvers["removeUserFromUserFamily"] =
  async (_parent, args, context) => {
    const userFamily = await UserFamily.findById({
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

    const user = (await User.findById({
      _id: args.userId,
    })) as InterfaceUserFamily;

    const userIsMemberOfUserFamily = userFamily?.users.some((member) => {
      return new mongoose.Types.ObjectId(member.toString()).equals(user?._id);
    });

    const userIdUserFamilyAdmin = userFamily?.admins.some((admin) => {
      new mongoose.Types.ObjectId(admin.toString()).equals(user?._id);
    });
    //Check whether user family exists.
    if (!userFamily) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE),
        USER_FAMILY_NOT_FOUND_ERROR.CODE,
        USER_FAMILY_NOT_FOUND_ERROR.PARAM,
      );
    }

    //check whether user is admin of the family.
    if (currentUser && currentUser._id) {
      const userId: string = currentUser._id.toString(); // Convert ObjectId to string
      await adminCheck(userId, userFamily);
    } else {
      console.error("Invalid currentUser or missing _id.");
      // Handle the case where currentUser is undefined or _id is missing
    }

    //Check whether user is member of the family.
    if (!userIsMemberOfUserFamily) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check if the current user is removing self
    if (user._id.equals(currentUser?._id)) {
      throw new errors.ConflictError(
        requestContext.translate(USER_REMOVING_SELF.MESSAGE),
        USER_REMOVING_SELF.CODE,
        USER_REMOVING_SELF.PARAM,
      );
    }

    /*
          userIsUserFamilyAdmin being true implies that the current user is an admin of userFamily.
          If userIsUserFamilyAdmin is true pushes error message to errors list and breaks out of loop.
        */
    if (userIdUserFamilyAdmin) {
      throw new errors.ConflictError(
        requestContext.translate(ADMIN_REMOVING_ADMIN.MESSAGE),
        ADMIN_REMOVING_ADMIN.CODE,
        ADMIN_REMOVING_ADMIN.PARAM,
      );
    }

    /*
          Administrators cannot remove creator of userFamily from the members list.
          Following if block matches userFamily's creator's id to
          user's id. Match being true implies that current user is the creator
          of userFamily. If match is true assigns error message to errors list
          and breaks out of loop.
        */
    if (
      new mongoose.Types.ObjectId(userFamily.creator.toString()).equals(
        user._id,
      )
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ADMIN_REMOVING_CREATOR.MESSAGE),
        ADMIN_REMOVING_CREATOR.CODE,
        ADMIN_REMOVING_CREATOR.PARAM,
      );
    }

    //Removes args.userId from users list of user family ans return the updated family.
    return (await UserFamily.findOneAndUpdate(
      {
        _id: args.familyId,
      },
      {
        $set: {
          users: userFamily.users.filter(
            (user) => user.toString() !== args.userId.toString(),
          ),
        },
      },
      {
        new: true,
      },
    ).lean()) as InterfaceUserFamily;
  };
