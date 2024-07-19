import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization, DirectChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";

/**
 * Creates a new direct chat and associates it with an organization.
 *
 * This resolver performs the following steps:
 *
 * 1. Retrieves the organization based on the provided `organizationId`.
 * 2. Checks if the organization exists, either from cache or database.
 * 3. Validates that all user IDs provided in `userIds` exist.
 * 4. Creates a new direct chat with the specified users and organization.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `organizationId`: The ID of the organization to associate with the direct chat.
 *     - `userIds`: An array of user IDs to be included in the direct chat.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created direct chat object.
 *
 * @remarks This function includes caching operations to optimize data retrieval and ensures that all user IDs are valid before creating the direct chat.
 */
export const createDirectChat: MutationResolvers["createDirectChat"] = async (
  _parent,
  args,
  context,
) => {
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();
    if (organization) await cacheOrganizations([organization]);
  }

  // Checks whether organization with _id === args.data.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Variable to store list of users to be members of directChat.
  const usersInDirectChat = [];

  // Loops over each item in args.data.userIds list.
  for await (const userId of args.data.userIds) {
    const userExists = !!(await User.exists({
      _id: userId,
    }));

    // Checks whether user with _id === userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    usersInDirectChat.push(userId);
  }

  // Creates new directChat.
  const createdDirectChat = await DirectChat.create({
    creatorId: context.userId,
    users: usersInDirectChat,
    organization: args.data.organizationId,
  });

  // Returns createdDirectChat.
  return createdDirectChat.toObject();
};
