import { Types } from "mongoose";
import { errors, requestContext } from "../libraries";
import {
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../constants";
import { Interface_Organization } from "../models";

export const creatorCheck = (
  userId: string | Types.ObjectId,
  organization: Interface_Organization
) => {
  const userIsCreator = userId.toString() === organization.creator.toString();

  if (userIsCreator === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }
};
