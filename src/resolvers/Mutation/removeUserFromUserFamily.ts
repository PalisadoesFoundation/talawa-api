import {
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { UserFamily } from "../../models/userFamily";
import { adminCheck } from "../../utilities/userFamilyAdminCheck";
import { Types } from "mongoose";
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
    const currentUser = await User.findById({
      _id: context.userId,
    });

    const user = await User.findById({
      _id: args.userId,
    });
    // Check whether the user exists.
    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const userIsMemberOfUserFamily = userFamily?.users.some((member) => {
      return Types.ObjectId(member).equals(user?._id);
    });

    const userIdUserFamilyAdmin = userFamily?.admins.some((admin) => {
      return Types.ObjectId(admin).equals(user?._id);
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
    await adminCheck(currentUser?._id, userFamily);

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
    Administrators cannot remove creator of userFamily from the members list.
    Following if block matches userFamily's creator's id to
    user's id. Match being true implies that current user is the creator
    of userFamily. If match is true assigns error message to errors list
    and breaks out of loop.
    */
    if (Types.ObjectId(userFamily.creator.toString()).equals(user._id)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ADMIN_REMOVING_CREATOR.MESSAGE),
        ADMIN_REMOVING_CREATOR.CODE,
        ADMIN_REMOVING_CREATOR.PARAM,
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

    //Removes args.userId from users list of user family ans return the updated family.
    return await UserFamily.findOneAndUpdate(
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
    ).lean();
  };
