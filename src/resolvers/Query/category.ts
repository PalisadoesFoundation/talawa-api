import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Category } from "../../models";
import { errors } from "../../libraries";
import { CATEGORY_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the category with given id from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the category that need to be fetched.
 * @returns An `category` object. If the `category` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const category: QueryResolvers["category"] = async (_parent, args) => {
  const category = await Category.findOne({
    _id: args.id,
  }).lean();

  if (!category) {
    throw new errors.NotFoundError(
      CATEGORY_NOT_FOUND_ERROR.DESC,
      CATEGORY_NOT_FOUND_ERROR.CODE,
      CATEGORY_NOT_FOUND_ERROR.PARAM
    );
  }

  return category;
};
