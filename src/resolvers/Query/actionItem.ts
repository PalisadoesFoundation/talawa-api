import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItem } from "../../models";
import { errors } from "../../libraries";
import { ACTION_ITEM_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the action item with given id from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the action item that need to be fetched.
 * @returns An `action item` object. If the `action item` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const actionItem: QueryResolvers["actionItem"] = async (
  _parent,
  args
) => {
  const actionItem = await ActionItem.findOne({
    _id: args.id,
  })
    .populate("org")
    .lean();

  if (!actionItem) {
    throw new errors.NotFoundError(
      ACTION_ITEM_NOT_FOUND_ERROR.DESC,
      ACTION_ITEM_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_NOT_FOUND_ERROR.PARAM
    );
  }

  return actionItem;
};
