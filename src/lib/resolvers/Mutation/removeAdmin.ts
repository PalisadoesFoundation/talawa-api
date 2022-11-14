import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { adminCheck, creatorCheck } from "../../utilities";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
} from "../../../constants";
/**
 * This function enables to remove an admin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists.
 * 3. If the user to be removed is an admin.
 * 4. If the user removing the admin is the creator of the organization
 * @returns Updated user.
 */
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
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether user is an admin of organization.
  adminCheck(user._id, organization);

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
