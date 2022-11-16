import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * This resolver function will fetch and return the creator of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the creator data. If the creator not exists then throws an `NotFoundError` error.
 */
export const creator: OrganizationResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator,
  }).lean();

  // if the user is null.
  if (!user) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return user;
};
