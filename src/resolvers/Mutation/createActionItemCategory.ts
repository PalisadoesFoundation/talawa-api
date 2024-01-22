import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, ActionItemCategory, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
} from "../../constants";

import { adminCheck } from "../../utilities";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";

/**
 * This function enables to create an ActionItemCategory.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the User exists
 * 2. If the Organization exists
 * 3. Is the User is Authorized
 * @returns Created ActionItemCategory
 */

export const createActionItemCategory: MutationResolvers["createActionItemCategory"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    // Checks whether currentUser with _id == context.userId exists.
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
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

      await cacheOrganizations([organization!]);
    }

    // Checks whether

    // Checks whether the organization with _id === args.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
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
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.PARAM
      );
    }

    // Creates new actionItemCategory.
    const createdActionItemCategory = await ActionItemCategory.create({
      name: args.name,
      organizationId: args.organizationId,
      creatorId: context.userId,
    });

    // Returns created actionItemCategory.
    return createdActionItemCategory.toObject();
  };
