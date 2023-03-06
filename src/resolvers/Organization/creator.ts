import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

export const creator: OrganizationResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return user;
};
