import {
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { ActionItemCategory, Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { adminCheck } from "../../utilities";

/**
 * Mutation resolver function to create a new ActionItemCategory.
 *
 * This function performs the following actions:
 * 1. Verifies that the current user, identified by `context.userId`, exists.
 * 2. Ensures that the organization specified by `args.organizationId` exists.
 * 3. Checks if the current user is authorized to perform the operation (must be an admin).
 * 4. Checks if an ActionItemCategory with the provided name already exists for the specified organization.
 * 5. Creates a new ActionItemCategory if no conflicts are found.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `name`: The name of the ActionItemCategory to be created.
 *   - `organizationId`: The ID of the organization where the ActionItemCategory will be created.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the created ActionItemCategory.
 *
 * @see ActionItemCategory - The ActionItemCategory model used to interact with the ActionItemCategory collection in the database.
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see User - The User model used to interact with the users collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 * @see cacheOrganizations - Service function to cache updated organization data.
 * @see findUserInCache - Service function to retrieve users from cache.
 * @see cacheUsers - Service function to cache updated user data.
 * @see adminCheck - Utility function to check if a user is an admin of an organization.
 */
export const createActionItemCategory: MutationResolvers["createActionItemCategory"] =
  async (_parent, args, context) => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }
    // Checks whether currentUser with _id == context.userId exists.
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([
      args.organizationId,
    ]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.organizationId,
      }).lean();
      if (organization) {
        await cacheOrganizations([organization]);
      }
    }

    // Checks whether the organization with _id === args.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether the user is authorized to perform the operation
    await adminCheck(context.userId, organization);

    // Checks whether an actionItemCategory with given name already exists for the current organization
    const existingActionItemCategory = await ActionItemCategory.findOne({
      organizationId: organization?._id,
      name: args.name,
    });

    if (existingActionItemCategory) {
      throw new errors.ConflictError(
        requestContext.translate(ACTION_ITEM_CATEGORY_ALREADY_EXISTS.MESSAGE),
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.CODE,
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.PARAM,
      );
    }

    // Creates new actionItemCategory.
    const createdActionItemCategory = await ActionItemCategory.create({
      name: args.name,
      isDisabled: args.isDisabled,
      organizationId: args.organizationId,
      creatorId: context.userId,
    });

    // Returns created actionItemCategory.
    return createdActionItemCategory.toObject();
  };
