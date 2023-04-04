import { Types } from "mongoose";
import { MEMBERSHIP_REQUEST_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { MembershipRequest } from "../../models";

/**
 * Throws error if there exists no `MembershipRequest` with the given `id` else returns matching `MembershipRequest` document
 * @param membershipRequestId - `id` of the desried membership request
 */
export const getValidMembershipRequestById = async (
  membershipRequestId: string | Types.ObjectId
) => {
  const membershipRequest = await MembershipRequest.findOne({
    _id: membershipRequestId,
  }).lean();

  if (!membershipRequest) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
      MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
      MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM
    );
  }

  return membershipRequest;
};
