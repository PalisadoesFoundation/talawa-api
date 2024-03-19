import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, AgendaSectionModel, AppUserProfile } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";

/**
 * Resolver function for the GraphQL mutation 'removeAgendaSection'.
 *
 * This resolver removes an agenda section and performs necessary authorization checks.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation.
 * @param context - The context object containing user information.
 * @returns A promise that resolves to the ID of the removed agenda section.
 */
export const removeAgendaSection: MutationResolvers["removeAgendaSection"] =
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
    const currentAppUserProfile = await AppUserProfile.findOne({
      userId: currentUser?._id,
    }).lean();
    if (!currentAppUserProfile) {
      throw new errors.UnauthenticatedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Fetch the agenda section to be removed
    const agendaSection = await AgendaSectionModel.findOne({
      _id: args.id,
    }).lean();

    // If the agenda section is not found, throw a NotFoundError
    if (!agendaSection) {
      throw new errors.NotFoundError(
        requestContext.translate(AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE),
        AGENDA_SECTION_NOT_FOUND_ERROR.CODE,
        AGENDA_SECTION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check if the current user is the creator of the agenda section or is a superadmin
    if (
      !agendaSection.createdBy.equals(currentUser._id) &&
      !currentAppUserProfile.isSuperAdmin
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Delete the agenda section
    await AgendaSectionModel.deleteOne({ _id: args.id });

    /*
        Remove agendaSection._id from appropriate lists
        on currentUser's document.
      */
    await User.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $pull: {
          // Add relevant lists here based on your schema
          createdAgendaSections: agendaSection._id,
        },
      },
    );

    return args?.id;
  };

export default removeAgendaSection;
