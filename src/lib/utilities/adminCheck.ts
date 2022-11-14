import { Types } from "mongoose";
import { errors, requestContext } from "../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";
import { Interface_Organization } from "../models";

/**
 * If the current user is an admin of the organisation, this function returns `true` otherwise it returns `false`.
 * @remarks
 * This is a utility method.
 * @param userId - Current user id.
 * @param organization - Organization data of `Interface_Organization` type.
 * @returns `True` or `False`.
 */
export const adminCheck = (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsOrganizationAdmin = organization.admins.some(
    (admin) => admin.toString() === userId.toString()
  );

  if (userIsOrganizationAdmin === false) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};
