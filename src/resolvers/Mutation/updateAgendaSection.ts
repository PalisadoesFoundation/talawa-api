import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { AgendaSectionModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the GraphQL mutation 'updateAgendaSection'.
 *
 * This resolver updates an agenda section and performs necessary authorization checks.
 *
 * @param  _parent - The parent object, not used in this resolver.
 * @param  args - The input arguments for the mutation.
 * @param  context - The context object containing user information.
 * @returns  A promise that resolves to the updated agenda section.
 */

export const updateAgendaSection: MutationResolvers["updateAgendaSection"] =
  async (_parent, args, context) => {
    // Fetch the current user
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    // Find the agenda section by ID
    const agendaSection = await AgendaSectionModel.findById(args.id);

    // If the agenda section is not found, throw a NotFoundError
    if (!agendaSection) {
      throw new errors.NotFoundError(
        requestContext.translate(
          AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,
          AGENDA_SECTION_NOT_FOUND_ERROR.PARAM,
        ),
        AGENDA_SECTION_NOT_FOUND_ERROR.CODE,
        AGENDA_SECTION_NOT_FOUND_ERROR.PARAM,
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
          USER_NOT_AUTHORIZED_ERROR.PARAM,
        ),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    agendaSection.description =
      args.input.description || agendaSection.description;
    agendaSection.sequence = args.input.sequence || agendaSection.sequence;
    agendaSection.updatedAt = new Date();

    const updatedAgendaSection = await agendaSection.save();

    return updatedAgendaSection;
  };
