import {
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, ActionItemCategory } from "../../models";
import { adminCheck } from "../../utilities";
/**
 * This function enables to update a actionItemCategory.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the actionItemCategory exists.
 * 3. If an actionItemCategory with the provided name already exists.
 * 4. If the user is authorized.
 * @returns Updated actionItemCategory.
 */

type UpdateActionItemCategoryInputType = {
  name: string;
  isDisabled: boolean;
};

export const updateActionItemCategory: MutationResolvers["updateActionItemCategory"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    // Checks if the user exists
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const actionItemCategory = await ActionItemCategory.findOne({
      _id: args.id,
    })
      .populate("organizationId")
      .lean();

    // Checks if the actionItemCategory exists
    if (!actionItemCategory) {
      throw new errors.NotFoundError(
        requestContext.translate(ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE),
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.CODE,
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.PARAM,
      );
    }

    // checks if an action item category already exists with the provided name
    if (args.data.name) {
      const actionItemCategoryAlreadyExists = await ActionItemCategory.findOne({
        name: args.data.name,
        organizationId: actionItemCategory.organizationId,
      });

      if (actionItemCategoryAlreadyExists) {
        throw new errors.ConflictError(
          requestContext.translate(ACTION_ITEM_CATEGORY_ALREADY_EXISTS.MESSAGE),
          ACTION_ITEM_CATEGORY_ALREADY_EXISTS.CODE,
          ACTION_ITEM_CATEGORY_ALREADY_EXISTS.PARAM,
        );
      }
    }

    await adminCheck(context.userId, actionItemCategory.organizationId);

    const updatedCategory = await ActionItemCategory.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        ...(args.data as UpdateActionItemCategoryInputType),
      },
      {
        new: true,
      },
    ).lean();

    return updatedCategory;
  };
