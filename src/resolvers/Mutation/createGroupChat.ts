import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { GroupChat, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new group chat and associates it with a specified organization.
 *
 * This resolver performs the following actions:
 *
 * 1. Checks if the specified organization exists in the cache, and if not, fetches it from the database and caches it.
 * 2. Verifies that the organization with the given ID exists.
 * 3. Checks if each user specified in the `userIds` list exists.
 * 4. Creates a new group chat with the specified users, organization, and title.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `organizationId`: The ID of the organization to associate with the group chat.
 *     - `userIds`: A list of user IDs to be added to the group chat.
 *     - `title`: The title of the group chat.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created group chat object.
 *
 * @remarks This function ensures the existence of the organization and users, and caches the organization if it is not already cached. It returns the created group chat object.
 */
export const createGroupChat: MutationResolvers["createGroupChat"] = async (
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

  // Checks whether the organization with _id === args.data.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Variable to store list of users to be members of group chat.
  const usersInGroupChat = [];

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

    usersInGroupChat.push(userId);
  }

  // Creates new group chat.
  const createdGroupChat = await GroupChat.create({
    creatorId: context.userId,
    users: usersInGroupChat,
    organization: args.data?.organizationId,
    title: args.data?.title,
  });

  // Returns created group chat.
  return createdGroupChat.toObject();
};
