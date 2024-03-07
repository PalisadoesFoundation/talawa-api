// import { Types } from "mongoose";
// import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
// import { AGENDA_SECTION_NOT_FOUND_ERROR } from "../../constants";
// import { AgendaSectionModel, User } from "../../models";
// import { errors, requestContext } from "../../libraries";

// /**
//  * Resolver function for the GraphQL query 'getAgendaSection'.
//  *
//  * This resolver retrieves an agenda section by its ID.
//  *
//  * @param {Object} _parent - The parent object, not used in this resolver.
//  * @param {Object} args - The input arguments for the query.
//  * @returns {Promise<Object>} A promise that resolves to the retrieved agenda section.
//  * @throws {NotFoundError} Throws an error if the agenda section is not found.
//  * @throws {InternalServerError} Throws an error for other potential issues during agenda section retrieval.
//  */
// export const getAgendaSection: QueryResolvers["getAgendaSection"] = async (
//   _parent,
//   { id }
// ) => {
//   // Find the agenda section by ID
//   const agendaSection = await AgendaSectionModel.findById(id).lean();

//   // If the agenda section is not found, throw a NotFoundError
//   if (!agendaSection) {
//     throw new errors.NotFoundError(
//       AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,

//       AGENDA_SECTION_NOT_FOUND_ERROR.CODE,
//       AGENDA_SECTION_NOT_FOUND_ERROR.PARAM
//     );
//   }

//   // Return the retrieved agenda section
//   return agendaSection;
// };