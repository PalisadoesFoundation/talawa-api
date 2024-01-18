import { AgendaItemModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the GraphQL query 'getAllAgendaItems'.
 *
 * This resolver fetches all agenda items from the database and returns them.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of agenda items.
 * @throws {Error} Throws an error if there is an issue fetching agenda items from the database.
 */
export const getAllAgendaItems: QueryResolvers["getAllAgendaItems"] =
  async () => {
    try {
      // Fetch all agenda items from the database
      const allAgendaItems = await AgendaItemModel.find().lean().exec();

      // Ensure that allAgendaItems is an array before returning
      return Array.isArray(allAgendaItems) ? allAgendaItems : [];
    } catch (error) {
      // Log and rethrow the error if there's an issue fetching agenda items
      console.error("Error fetching agenda items:", error);
      throw error;
    }
  };
