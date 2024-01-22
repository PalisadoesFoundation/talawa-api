import { AgendaItemModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";

export const getAllAgendaItems: QueryResolvers["getAllAgendaItems"] = async (
  _parent,
  _args,
  context
) => {
  try {
    // Fetch the current user
    const currentUser = await User.findById(context.userId).lean();

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if the user is a superadmin or admin
    const isAdmin =
      currentUser.userType === "SUPERADMIN" || currentUser.adminFor.length > 0;

    // If the user is not a superadmin or admin, throw an UnauthorizedError
    if (!isAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Fetch all agenda items from the database
    const allAgendaItems = await AgendaItemModel.find().lean().exec();

    // Ensure that allAgendaItems is an array before returning
    return Array.isArray(allAgendaItems) ? allAgendaItems : [];
  } catch (error) {
    // Log and rethrow the error if there's an issue fetching agenda items or handling authorization
    console.error("Error fetching agenda items:", error);
    throw error;
  }
};
