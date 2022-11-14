import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import {
  USER_NOT_FOUND,
  MEMBER_NOT_FOUND,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to remove a member.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user to be removed exists.
 * 3. If the user is the admin of the organization.
 * 4. If the user to be removed is a member of the organization.
 * @returns Organization.
 */
export const removeMember: MutationResolvers["removeMember"] = async (
  _parent,
  args,
  context
) => {
  let organization = await Organization.findOne({
    _id: args.data.organizationId,
  }).lean();

  // Checks if organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // Checks whether current user making the request is an admin of organization.
  adminCheck(context.userId, organization);

  /* 
  Errors inside a loop stop the loop it doesnt throw the error, errors have to be
  stored in an array an thrown at the end. This variable is used to store all the
  errors we want to throw from the following for loop.
  */
  const errorsToThrow = [];

  for await (const userId of args.data.userIds) {
    // do not run an async function inside a for each loop - it doesnt work

    const user = await User.findOne({
      _id: userId,
    }).lean();

    // Checks if a user with _id === userId exists.
    if (!user) {
      errorsToThrow.push(USER_NOT_FOUND);
      break;
    }

    // Boolean to determine whether user is a member of organization.
    const userIsOrganizationMember = organization?.members.some(
      (member) => member.toString() === user._id.toString()
    );

    /*
    userIsOrganizationMember being true implies that the current user is a member of organization.
    If userIsOrganizationMember is false pushes error message to errors list and breaks out of loop.
    */
    if (userIsOrganizationMember === false) {
      errorsToThrow.push(MEMBER_NOT_FOUND);
      break;
    }

    // Boolean to determine whether user is an admin of organization.
    const userIsOrganizationAdmin = organization?.admins.some(
      (admin) => admin.toString() === user._id.toString()
    );

    /*
    userIsOrganizationAdmin being true implies that the current user is an admin of organization.
    If userIsOrganizationAdmin is true pushes error message to errors list and breaks out of loop.
    */
    if (userIsOrganizationAdmin === true) {
      errorsToThrow.push(
        "Administrators cannot remove members who are also Administrators"
      );
      break;
    }

    /*
    Administrators cannot remove creator of organzation from the members list.
    Following if block matches organization's creator's id to
    user's id. Match being true implies that current user is the creator
    of organization. If match is true assigns error message to errors list
    and breaks out of loop.
    */
    if (organization?.creator.toString() === user._id.toString()) {
      errorsToThrow.push(
        "Administrators cannot remove the creator of the organization from the organization"
      );
      break;
    }

    // Removes user's id from members list on organization.
    organization = await Organization.findOneAndUpdate(
      {
        _id: organization?._id,
      },
      {
        $set: {
          members: organization?.members.filter(
            (member) => member.toString() !== user._id.toString()
          ),
        },
      },
      {
        new: true,
      }
    ).lean();

    // Remove organization's id from joinedOrganizations list on user.
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          joinedOrganizations: user.joinedOrganizations.filter(
            (joinedOrganization) =>
              joinedOrganization.toString() !== organization?._id.toString()
          ),
        },
      }
    );
  }

  if (errorsToThrow.length > 0) {
    throw new Error(errorsToThrow.join());
  }

  return organization!;
};
