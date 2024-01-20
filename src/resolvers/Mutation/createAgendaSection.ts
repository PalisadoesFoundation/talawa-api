import { AgendaSectionModel, User, Event } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  AGENDA_SECTION_CREATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../constants";

/**
 * Resolver function for the GraphQL mutation 'createAgendaSection'.
 *
 * This resolver creates a new agenda section and performs necessary authorization checks.
 *
 * @param {Object} _parent - The parent object, not used in this resolver.
 * @param {Object} args - The input arguments for the mutation.
 * @param {Object} context - The context object containing user information.
 * @returns {Promise<Object>} A promise that resolves to the created agenda section.
 * @throws {NotFoundError} Throws an error if the user is not found.
 * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
 * @throws {InternalServerError} Throws an error for other potential issues during agenda section creation.
 */
export const createAgendaSection: MutationResolvers["createAgendaSection"] =
  async (_parent, args, context) => {
    // Verify that args and args.input exist
    const userId = context.userId;
    const currentUser = await User.findOne({
      _id: userId,
    }).lean();

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    if (!args || !args.input) {
      throw new errors.InternalServerError("Invalid arguments");
    }

    // Verify that createdBy is defined in args.input
    if (userId === null || userId === undefined) {
      throw new errors.InternalServerError("Invalid createdBy value");
    }

    console.log("Args:", args);
    console.log("Args Input:", args.input);

    // Check if the user is an event admin
    const isEventAdmin = currentUser.eventAdmin.some(
      (eventId) => eventId === args.input.relatedEvent
    );
    const event = await Event.findOne({
      _id: args.input.relatedEvent?.toString(),
    }).populate("organization");

    if (event) {
      const organizationId = event.organization?._id;
      const hasAdminPermissions =
        currentUser.adminFor.includes(organizationId) ||
        currentUser.userType === "SUPERADMIN";

      if (!hasAdminPermissions || isEventAdmin) {
        throw new errors.UnauthorizedError(
          requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
          USER_NOT_AUTHORIZED_ERROR.CODE,
          USER_NOT_AUTHORIZED_ERROR.PARAM
        );
      }
    } else {
      throw new errors.UnauthorizedError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    // Set createdAt and updatedAt fields
    const now = new Date();
    const agendaSectionData = {
      ...args.input,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    // Create the AgendaSection
    console.log("Agenda Section Data:", agendaSectionData);
    const createdAgendaSection = await AgendaSectionModel.create(
      agendaSectionData
    );

    // Return the created agenda section
    return createdAgendaSection;
  };
