import type {
  QueryResolvers,
  AgendaCategory,
} from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
import { errors, requestContext } from "../../libraries";
import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../constants";

/**
 * Resolver function for the GraphQL query 'agendaCategories'.
 *
 * This resolver fetches all agenda categories from the database.
 *
 * @returns {Promise<Array<AgendaCategory>>} A promise that resolves to an array of agenda categories.
 * @throws {InternalServerError} Throws an error for potential issues during agenda categories fetching.
 */
export const agendaCategories: QueryResolvers["agendaCategories"] =
  async () => {
    try {
      // Fetch all agenda categories from the database
      const allAgendaCategories = await AgendaCategoryModel.find()
        .lean()
        .exec();

      return allAgendaCategories;
    } catch (error) {
      // Log the error stack trace
      console.error("Error fetching agenda categories:", error);

      // Handle other potential errors in a consistent way
      throw new errors.InternalServerError(
        "An error occurred while fetching agenda categories"
      );
    }
  };
