import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { MembershipRequest, Organization, User } from "../../models";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function accepts the membership request sent by a user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the membership request exists or not.
 * 2. Whether thr organization exists or not
 * 3. Whether the user exists
 * 4. whether currentUser with _id === context.userId is an admin of organization.
 * 5. Whether user is already a member of organization.
 */
export const acceptMembershipRequest: MutationResolvers["acceptMembershipRequest"] =
  async (_parent, args, context) => {
    /* Finding a single `MembershipRequest` document in the database that matches the
    `_id` provided in the `args` parameter. It is then populating the `organization` and `user`
    fields of the `MembershipRequest` document with their respective documents from the
    `Organization` and `User` collections in the database. Finally, it is executing the query and
    returning a promise that resolves to the `MembershipRequest` document. */
    const membershipRequest = await MembershipRequest.findOne({
      _id: args.membershipRequestId,
    })
      .populate(["organization", "user"])
      .exec();

    // Checks whether membershipRequest exists.
    if (!membershipRequest) {
      throw new errors.NotFoundError(
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM
      );
    }

    const organization = membershipRequest.organization;

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    const user = membershipRequest.user;

    // Checks whether user exists.
    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    const userIsOrganizationMember = organization.members.some(
      (member: string) => member.toString() === user?._id.toString()
    );

    // Checks whether user is already a member of organization.
    if (userIsOrganizationMember === true) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM
      );
    }

    // Delete the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    /* This code is updating the `Organization` document in the database by adding the `user._id` to the
   `members` array and removing the `membershipRequest._id` from the `membershipRequests` array. It
   is using the `updateOne` method from the `Organization` model to update the document with the
   `_id` matching `organization._id`. The `` operator is used to add the `user._id` to the
   `members` array, and the `` operator is used to remove the `membershipRequest._id` from the
   `membershipRequests` array. */
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          members: user._id,
        },
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      }
    );

    /* This code is updating the `User` document in the database by adding the `organization._id` to
    the `joinedOrganizations` array and removing the `membershipRequest._id` from the
    `membershipRequests` array. It is using the `updateOne` method from the `User` model to update
    the document with the `_id` matching `user._id`. The `` operator is used to add the
    `organization._id` to the `joinedOrganizations` array, and the `` operator is used to
    remove the `membershipRequest._id` from the `membershipRequests` array. */
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $push: {
          joinedOrganizations: organization._id,
        },
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      }
    );

    return membershipRequest;
  };
