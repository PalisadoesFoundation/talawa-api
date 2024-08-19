import { OrganizationTagUser } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { TAG_NOT_FOUND } from "../../constants";

export const getUserTag: QueryResolvers["getUserTag"] = async (
  _parent,
  args,
) => {
  const userTag = await OrganizationTagUser.findById(args.id).lean();

  if (!userTag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM,
    );
  }

  return userTag;
};
