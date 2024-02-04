import type {
  QueryResolvers,
  AgendaCategory,
} from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
import { errors, requestContext } from "../../libraries";
import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../constants";
/* eslint-disable */
/**
 * Resolver function for the GraphQL query 'agendaCategories'.
 *
 * This resolver fetches all agenda categories from the database.
 *
 * @returns {Promise<Array<AgendaCategory>>} A promise that resolves to an array of agenda categories.
 * @throws {InternalServerError} Throws an error for potential issues during agenda categories fetching.
 */
/* eslint-enable */
export const agendaCategories: QueryResolvers["agendaCategories"] =
  async () => {
    const allAgendaCategories = await AgendaCategoryModel.find().lean().exec();

    return allAgendaCategories;
  };
