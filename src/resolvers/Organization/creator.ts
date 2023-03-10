import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";

export const creator: OrganizationResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return user;
};
