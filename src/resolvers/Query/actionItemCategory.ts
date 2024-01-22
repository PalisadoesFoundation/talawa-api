import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItemCategory } from "../../models";
import { errors } from "../../libraries";
import { ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the actionItemCategory with given id from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the actionItemCategory that need to be fetched.
 * @returns An `actionItemCategory` object. If the `actionItemCategory` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const actionItemCategory: QueryResolvers["actionItemCategory"] = async (
  _parent,
  args
) => {
  const actionItemCategory = await ActionItemCategory.findOne({
    _id: args.id,
  }).lean();

  if (!actionItemCategory) {
    throw new errors.NotFoundError(
      ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.DESC,
      ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.PARAM
    );
  }

  return actionItemCategory;
};
