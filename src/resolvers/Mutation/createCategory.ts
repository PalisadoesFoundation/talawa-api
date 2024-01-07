import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Category, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";

import { adminCheck } from "../../utilities";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";

/**
 * This function enables to create a Category.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the User exists
 * 2. If the Organization exists
 * 3. Is the User is Authorized
 * @returns Created Category
 */

export const createCategory: MutationResolvers["createCategory"] = async (
  _parent,
  args,
  context
) => {
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

  const organizationFoundInCache = await findOrganizationsInCache([args.orgId]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache[0] == null) {
    organization = await Organization.findOne({
      _id: args.orgId,
    }).lean();

    await cacheOrganizations([organization!]);
  }

  // Checks whether the organization with _id === args.orgId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether the user is authorized to perform the operation
  await adminCheck(context.userId, organization);

  // Creates new category.
  const createdCategory = await Category.create({
    category: args.category,
    org: args.orgId,
    createdBy: context.userId,
    updatedBy: context.userId,
  });

  await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $push: { actionCategories: createdCategory._id },
    }
  );

  // Returns created category.
  return createdCategory.toObject();
};
