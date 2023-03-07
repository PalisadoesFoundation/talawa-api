import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { creatorCheck, superAdminCheck } from "../../utilities";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  USER_NOT_ORGANIZATION_ADMIN,
} from "../../constants";

export const removeAdmin: MutationResolvers["removeAdmin"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether user is an admin of the organization.
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    admin.equals(user._id)
  );

  if (!userIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_ORGANIZATION_ADMIN.message}`),
      USER_NOT_ORGANIZATION_ADMIN.code,
      USER_NOT_ORGANIZATION_ADMIN.param
    );
  }

  // Checks whether the current user is a superadmin.
  superAdminCheck(currentUser!);

  // Checks whether currentUser with _id === context.userId is the creator of organization.
  creatorCheck(context.userId, organization);

  // Removes user._id from admins list of the organization.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $set: {
        admins: organization.admins.filter(
          (admin) => admin.toString() !== user!._id.toString()
        ),
      },
    }
  );

  // Removes organization._id from adminFor list of the user and returns the updated user.
  return await User.findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $set: {
        adminFor: user.adminFor.filter(
          (adminForOrganization) =>
            adminForOrganization.toString() !== organization._id.toString()
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
