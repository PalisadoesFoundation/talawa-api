import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { TAG_NOT_FOUND } from "../../constants";

/**
 * Retrieves the ancestor tags of a given user tag.
 *
 * This function fetches the ancestor tags of a specific user tag from the database. If the user tag
 * is not found, it throws an error indicating that the item does not exist.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the ID of the given user tag.
 *
 * @returns The ancestor tags of the user tag.
 */

export const getUserTagAncestors: QueryResolvers["getUserTagAncestors"] =
  async (_parent, args) => {
    let currentTag = await OrganizationTagUser.findById(args.id).lean();

    if (!currentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM,
      );
    }

    const tagAncestors = [currentTag];

    while (currentTag?.parentTagId) {
      const currentParent = (await OrganizationTagUser.findById(
        currentTag.parentTagId,
      ).lean()) as InterfaceOrganizationTagUser | null;

      if (currentParent) {
        tagAncestors.push(currentParent);
        currentTag = currentParent;
      }
    }

    return tagAncestors.reverse();
  };
