import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables to join a public organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the organization is public.
 * 3. If the user exists
 * 4. If the user is already a member of the organization.
 * @returns Updated user.
 */
export const joinPublicOrganization: MutationResolvers["joinPublicOrganization"] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether organization is public.
    if (organization.isPublic === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser with _id === context.userId exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const currentUserIsOrganizationMember = organization.members.some(
      (member) => member.toString() === context.userId.toString()
    );

    // Checks whether currentUser with _id === context.userId is already a member of organzation.
    if (currentUserIsOrganizationMember === true) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM
      );
    }

    // Adds context.userId to members list of organzation's document.
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          members: context.userId,
        },
      }
    );

    /* 
    Adds organization._id to joinedOrganizations list of currentUser's document
    with _id === context.userId and returns the updated currentUser.
    */
    return await User.findOneAndUpdate(
      {
        _id: context.userId,
      },
      {
        $push: {
          joinedOrganizations: organization._id,
        },
      },
      {
        new: true,
      }
    )
      .select(["-password"])
      .populate("joinedOrganizations")
      .lean();
  };
