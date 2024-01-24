import { AgendaItemModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";

export const getAllAgendaItems: QueryResolvers["getAllAgendaItems"] = async (
  _parent,
  _args
) => {
  try {
    // Fetch all agenda items from the database
    const allAgendaItems = await AgendaItemModel.find().lean().exec();
    return Array.isArray(allAgendaItems) ? allAgendaItems : [];
  } catch (error) {
    // Log and rethrow the error if there's an issue fetching agenda items or handling authorization
    console.error("Error fetching agenda items:", error);
    throw error;
  }
};
