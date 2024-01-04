import {
  CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Category } from "../../models";
import { Types } from "mongoose";
/**
 * This function enables to update a task.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the category exists.
 * 3. If the user is authorized.
 * @returns Updated category.
 */

type UpdateCategoryInputType = {
  category: string;
  disabled: boolean;
};

export const updateCategory: MutationResolvers["updateCategory"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks if the user exists
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const category = await Category.findOne({
    _id: args.id,
  }).lean();

  // Checks if the category exists
  if (!category) {
    throw new errors.NotFoundError(
      requestContext.translate(CATEGORY_NOT_FOUND_ERROR.MESSAGE),
      CATEGORY_NOT_FOUND_ERROR.CODE,
      CATEGORY_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsOrgAdmin = currentUser.adminFor.some(
    (ogranizationId) =>
      ogranizationId === category.org ||
      Types.ObjectId(ogranizationId).equals(category.org)
  );

  // Checks if the user is authorized for the operation.
  if (
    currentUserIsOrgAdmin === false &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  const updatedCategory = await Category.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as UpdateCategoryInputType),
      updatedBy: context.userId,
    },
    {
      new: true,
    }
  ).lean();

  return updatedCategory;
};
