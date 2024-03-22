import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
import { errors } from "../../libraries";
import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../constants";

/**
 * This is a resolver function for the GraphQL query 'agendaCategory'.
 *
 * This resolver fetches an agenda category by its ID.
 *
 *
 * @param _parent -  The parent object, not used in this resolver.
 * @param args -  The input arguments for the query.
 * @returns A promise that resolves to the fetched agenda category.
 * @throws `NotFoundError` If the agenda category is not found.
 * @throws `InternalServerError` For other potential issues during agenda category fetching.
 */

export const agendaCategory: QueryResolvers["agendaCategory"] = async (
  _parent,
  args,
) => {
  // Find the AgendaCategory by ID
  const foundAgendaCategory = await AgendaCategoryModel.findById(
    args.id,
  ).lean();

  // If the AgendaCategory is not found, throw a NotFoundError
  if (!foundAgendaCategory) {
    throw new errors.NotFoundError(
      AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
      AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return foundAgendaCategory as any;
};
