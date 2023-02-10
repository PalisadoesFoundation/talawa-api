import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  MEMBER_NOT_FOUND_MESSAGE,
  MEMBER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_PARAM,
  MEMBER_NOT_FOUND_CODE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../constants";

export const leaveOrganization: MutationResolvers["leaveOrganization"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser is the creator of organzation.
  if (currentUser._id.toString() === organization.creator.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  const currentUserIsOrganizationMember = organization.members.some(
    (member) => member.toString() === currentUser!._id.toString()
  );

  // Checks whether currentUser is not a member of organzation.
  if (currentUserIsOrganizationMember === false) {
    throw new errors.ConflictError(
      requestContext.translate(MEMBER_NOT_FOUND_MESSAGE),
      MEMBER_NOT_FOUND_CODE,
      MEMBER_NOT_FOUND_PARAM
    );
  }

  // Removes currentUser._id from admins and members lists of organzation's document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $set: {
        admins: organization.admins.filter(
          (admin) => admin.toString() !== currentUser!._id.toString()
        ),
        members: organization.members.filter(
          (member) => member.toString() !== currentUser!._id.toString()
        ),
      },
    }
  );

  /*
  Removes organization._id from joinedOrganizations list of currentUser's document
  and returns the updated currentUser.
  */
  return await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        joinedOrganizations: currentUser.joinedOrganizations.filter(
          (joinedOrganization) =>
            joinedOrganization.toString() !== organization._id.toString()
        ),
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();
};
