import "dotenv/config";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities/userFamilyAdminCheck";
import { User } from "../../models";
import { UserFamily } from "../../models/userFamily";
import type { InterfaceUserFamily } from "../../models/userFamily";
import {
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function adds user to the family.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of the entire application
 * @remarks The following checks are done:
 * 1. If the family exists
 * 2. If the user exists
 * 3. If the user is already member of the family
 * 4. If the user is admin of the user Family
 * @returns Updated family
 */
export const addUserToUserFamily: MutationResolvers["addUserToUserFamily"] =
  async (_parent, args, context) => {
    const userFamily = await UserFamily.findOne({
      _id: args.familyId,
    }).lean();

    const currentUser = await User.findById({
      _id: context.userId,
    });

    // Checks whether user with _id === args.userId exists.
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    //check wheather family exists
    if (!userFamily) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE),
        USER_FAMILY_NOT_FOUND_ERROR.CODE,
        USER_FAMILY_NOT_FOUND_ERROR.PARAM,
      );
    }

    //check whether user is admin of the family
    await adminCheck(currentUser?._id, userFamily);

    const isUserMemberOfUserFamily = userFamily.users.some((user) => {
      user.equals(args.userId);
    });

    // Checks whether user with _id === args.userId is already a member of Family.
    if (isUserMemberOfUserFamily) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM,
      );
    }

    // Adds args.userId to users lists on family group and return the updated family.
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
