import { User } from "../../models";
import {
  COMMUNITY_NOT_FOUND_ERROR,
  INVALID_TIMEOUT_RANGE,
  USER_NOT_FOUND_ERROR,
  UPDATE_SESSION_TIMEOUT_ARGUMENT_MISSING_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { superAdminCheck } from "../../utilities";
import { Community } from "../../models/Community";

/**
 * Payload provided with the request for updating organization timeout.
 */
interface InterfaceUpdateTimeoutArgs {
  timeout: number;
}

/**
 * This function updates the session timeout and can only be performed by superadmin users.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request, including organizationId and timeout
 * @param context - context of the entire application, containing user information
 * @returns - A message true if the organization timeout is updated successfully
 * @throws - NotFoundError: If the user or organization is not found
 * @throws - ValidationError: If the user is not an admin or superadmin, or if the timeout is outside the valid range
 * @throws - InternalServerError: If there is an error updating the organization timeout
 */

export const updateSessionTimeout: MutationResolvers["updateSessionTimeout"] =
  async (_parent, args: InterfaceUpdateTimeoutArgs, context) => {
    if (!args.timeout) {
      throw new errors.InputValidationError(
        requestContext.translate(
          UPDATE_SESSION_TIMEOUT_ARGUMENT_MISSING_ERROR.MESSAGE
        ),
        UPDATE_SESSION_TIMEOUT_ARGUMENT_MISSING_ERROR.CODE,
        UPDATE_SESSION_TIMEOUT_ARGUMENT_MISSING_ERROR.PARAM
      );
    }
    const userId = context.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    superAdminCheck(user);

    const community = await Community.findOne().lean();

    if (!community) {
      throw new errors.NotFoundError(
        requestContext.translate(COMMUNITY_NOT_FOUND_ERROR.MESSAGE),
        COMMUNITY_NOT_FOUND_ERROR.CODE,
        COMMUNITY_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if the timeout is in the valid range of 15 to 60 minutes
    if (args.timeout < 15 || args.timeout > 60 || args.timeout % 5 !== 0) {
      throw new errors.ValidationError([
        {
          message: requestContext.translate(INVALID_TIMEOUT_RANGE.MESSAGE),
          code: INVALID_TIMEOUT_RANGE.CODE,
          param: INVALID_TIMEOUT_RANGE.PARAM,
        },
      ]);
    }

    await Community.findByIdAndUpdate(
      community._id,
      { timeout: args.timeout },
      { new: true }
    );

    return true;
  };
