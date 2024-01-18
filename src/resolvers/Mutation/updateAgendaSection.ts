import { Types } from "mongoose";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { AgendaSectionModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the GraphQL mutation 'updateAgendaSection'.
 *
 * This resolver updates an agenda section and performs necessary authorization checks.
 *
 * @param {Object} _parent - The parent object, not used in this resolver.
 * @param {Object} args - The input arguments for the mutation.
 * @param {Object} context - The context object containing user information.
 * @returns {Promise<Object>} A promise that resolves to the updated agenda section.
 * @throws {NotFoundError} Throws an error if the agenda section is not found.
 * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
 * @throws {InternalServerError} Throws an error for other potential issues during agenda section update.
 */
export const updateAgendaSection: MutationResolvers["updateAgendaSection"] =
  async (_parent, args, context) => {
    const { id, input } = args;

    // Find the agenda section by ID
    const agendaSection = await AgendaSectionModel.findById(id);

    // If the agenda section is not found, throw a NotFoundError
    if (!agendaSection) {
      throw new errors.NotFoundError(
        requestContext.translate(
          AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,
          AGENDA_SECTION_NOT_FOUND_ERROR.PARAM
        ),
        AGENDA_SECTION_NOT_FOUND_ERROR.CODE,
        AGENDA_SECTION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Fetch the current user
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Check if the current user is the creator of the agenda section or is a superadmin
    if (
      !agendaSection.createdBy.equals(currentUser._id) &&
      currentUser.userType !== "SUPERADMIN"
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(
          USER_NOT_AUTHORIZED_ERROR.MESSAGE,
          USER_NOT_AUTHORIZED_ERROR.PARAM
        ),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Update the agenda section fields based on the input
    agendaSection.description = input.description || agendaSection.description;
    agendaSection.sequence = input.sequence || agendaSection.sequence;
    agendaSection.updatedAt = new Date();

    // Save the updated agenda section
    const updatedAgendaSection = await agendaSection.save();

    return updatedAgendaSection.toObject(); // Return as plain JavaScript object
  };
