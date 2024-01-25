import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { AgendaCategoryModel, User } from "../../models";
import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { adminCheck } from "../../utilities";

/**
 * Resolver function for the GraphQL mutation 'updateAgendaCategory'.
 *
 * This resolver updates an existing agenda category based on the provided ID.
 * It checks if the user has the necessary permissions to update the agenda category.
 *
 * @param {Object} _parent - The parent object, not used in this resolver.
 * @param {Object} args - The input arguments for the mutation.
 * @param {Object} context - The context object containing user information.
 * @returns {Promise<Object>} A promise that resolves to the updated agenda category.
 * @throws {NotFoundError} Throws an error if the agenda category or user is not found.
 * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
 * @throws {InternalServerError} Throws an error for other potential issues during agenda category update.
 */

export const updateAgendaCategory: MutationResolvers["updateAgendaCategory"] =
  async (_parent, args, context) => {
    // Check if the AgendaCategory exists
    // Fetch the user to get the organization ID

    const userId = context.userId;
    const user = await User.findById(userId);

    // If the user is not found, throw a NotFoundError
    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }
    const existingAgendaCategory = await AgendaCategoryModel.findById(
      args.id
    ).lean();

    // If the AgendaCategory is not found, throw a NotFoundError
    if (!existingAgendaCategory) {
      throw new errors.NotFoundError(
        requestContext.translate(AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE),
        AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
        AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if the user is the creator of the agenda category
    if (existingAgendaCategory.createdBy?.toString() !== args.id) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Update the AgendaCategory
    const updatedAgendaCategory = await AgendaCategoryModel.findByIdAndUpdate(
      args.id,
      {
        ...(args.input as any),
      },
      {
        new: true,
      }
    ).lean();

    return updatedAgendaCategory!;
  };
