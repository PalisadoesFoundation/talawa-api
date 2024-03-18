import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AGENDA_SECTION_NOT_FOUND_ERROR } from "../../constants";
import { AgendaSectionModel } from "../../models";
import { errors } from "../../libraries";

/**
 * Resolver function for the GraphQL query 'getAgendaSection'.
 *
 * This resolver retrieves an agenda section by its ID.
 *
 * @param  _parent - The parent object, not used in this resolver.
 * @param  args - The input arguments for the query.
 */
export const getAgendaSection: QueryResolvers["getAgendaSection"] = async (
  _parent,
  { id },
) => {
  // Find the agenda section by ID
  const agendaSection = await AgendaSectionModel.findById(id).lean();

  // If the agenda section is not found, throw a NotFoundError
  if (!agendaSection) {
    throw new errors.NotFoundError(
      AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,

      AGENDA_SECTION_NOT_FOUND_ERROR.CODE,
      AGENDA_SECTION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Return the retrieved agenda section
  return agendaSection;
};
