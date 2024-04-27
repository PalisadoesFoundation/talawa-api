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
 * This function enables to create a group chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * @returns Created group chat
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

  // Checks whether organization with _id === args.data.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Variable to store list of users to be members of groupChat.
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

  // Creates new groupChat.
  const createdGroupChat = await GroupChat.create({
    creatorId: context.userId,
    users: usersInGroupChat,
    organization: args.data?.organizationId,
    title: args.data?.title,
  });

  // Returns createdGroupChat.
  return createdGroupChat.toObject();
};
