import { MutationResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User, Organization } from '../../models';
import { errors, requestContext } from '../../libraries';
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from '../../../constants';

export const joinPublicOrganization: MutationResolvers['joinPublicOrganization'] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    // Checks whether organization is public.
    if (organization.isPublic === false) {
      throw new errors.UnauthorizedError(
        IN_PRODUCTION !== true
          ? USER_NOT_AUTHORIZED
          : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
        USER_NOT_AUTHORIZED_CODE,
        USER_NOT_AUTHORIZED_PARAM
      );
    }

    let currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser with _id === context.userId exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const currentUserIsOrganizationMember = organization.members.some(
      (member) => member.toString() === context.userId.toString()
    );

    // Checks whether currentUser with _id === context.userId is already a member of organzation.
    if (currentUserIsOrganizationMember === true) {
      throw new errors.ConflictError(
        IN_PRODUCTION !== true
          ? USER_ALREADY_MEMBER
          : requestContext.translate(USER_ALREADY_MEMBER_MESSAGE),
        USER_ALREADY_MEMBER_CODE,
        USER_ALREADY_MEMBER_PARAM
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
      .select(['-password'])
      .lean();
  };
