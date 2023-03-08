import { errors, requestContext } from "../libraries";
import { USER_NOT_AUTHORIZED_ERROR } from "../constants";
import { Types } from "mongoose";
import { Interface_Organization } from "../models";

export const creatorCheck = (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsCreator = userId.toString() === organization.creator.toString();

  if (userIsCreator === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }
};
