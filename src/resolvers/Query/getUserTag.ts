import { OrganizationTagUser } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { TAG_NOT_FOUND } from "../../constants";

/**
 * Retrieves a user tag by its ID.
 *
 * This function fetches a specific user tag from the database using its ID. If the user tag
 * is not found, it throws an error indicating that the item does not exist.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the ID of the user tag to retrieve.
 *
 * @returns The user tag with the specified ID.
 */

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
