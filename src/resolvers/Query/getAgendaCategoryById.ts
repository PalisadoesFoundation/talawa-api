import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
import { errors, requestContext } from "../../libraries";
import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../constants";
/* eslint-disable */

/**
 * Resolver function for the GraphQL query 'agendaCategory'.
 *
 * This resolver fetches an agenda category by its ID.
 *
 * @param {Object} _parent - The parent object, not used in this resolver.
 * @param {Object} args - The input arguments for the query.
 * @param {Object} _context - The context object (not used in this resolver).
 * @returns {Promise<Object>} A promise that resolves to the fetched agenda category.
 * @throws {NotFoundError} Throws an error if the agenda category is not found.
 * @throws {InternalServerError} Throws an error for other potential issues during agenda category fetching.
 */
/* eslint-enable */

export const agendaCategory: QueryResolvers["agendaCategory"] = async (
  _parent,
  args,
  _context
) => {
  // Find the AgendaCategory by ID
  const foundAgendaCategory = await AgendaCategoryModel.findById(
    args.id
  ).lean();

  // If the AgendaCategory is not found, throw a NotFoundError
  if (!foundAgendaCategory) {
    throw new errors.NotFoundError(
      AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
      AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM
    );
  }
  return foundAgendaCategory;
};
