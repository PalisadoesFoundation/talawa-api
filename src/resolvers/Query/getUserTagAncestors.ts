import { OrganizationTagUser } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { TAG_NOT_FOUND } from "../../constants";

export const getUserTagAncestors: QueryResolvers["getUserTagAncestors"] =
  async (_parent, args) => {
    let currentTag = await OrganizationTagUser.findById(args.id).lean();

    const tagAncestors = [currentTag];

    while (currentTag?.parentTagId) {
      const currentParent = await OrganizationTagUser.findById(
        currentTag.parentTagId,
      ).lean();

      if (currentParent) {
        tagAncestors.push(currentParent);
        currentTag = currentParent;
      }
    }

    if (!currentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM,
      );
    }

    return tagAncestors.reverse();
  };
