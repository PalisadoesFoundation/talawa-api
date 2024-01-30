// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { AgendaCategoryModel, User } from "../../models";
// import {
//   AGENDA_CATEGORY_NOT_FOUND_ERROR,
//   USER_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
// } from "../../constants";
// import { adminCheck } from "../../utilities";
// import { Types } from "mongoose";

// /**
//  * Resolver function for the GraphQL mutation 'updateAgendaCategory'.
//  *
//  * This resolver updates an existing agenda category based on the provided ID.
//  * It checks if the user has the necessary permissions to update the agenda category.
//  *
//  * @param {Object} _parent - The parent object, not used in this resolver.
//  * @param {Object} args - The input arguments for the mutation.
//  * @param {Object} context - The context object containing user information.
//  * @returns {Promise<Object>} A promise that resolves to the updated agenda category.
//  * @throws {NotFoundError} Throws an error if the agenda category or user is not found.
//  * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
//  * @throws {InternalServerError} Throws an error for other potential issues during agenda category update.
//  */

// export const updateAgendaCategory: MutationResolvers["updateAgendaCategory"] =
//   async (_parent, args, context) => {
//     // Check if the AgendaCategory exists
//     // Fetch the user to get the organization ID

//     const userId = context.userId;
//     const currentUser = await User.findById(userId);

//     // If the user is not found, throw a NotFoundError
//     if (!currentUser) {
//       throw new errors.NotFoundError(
//         requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//         USER_NOT_FOUND_ERROR.CODE,
//         USER_NOT_FOUND_ERROR.PARAM
//       );
//     }
//     const existingAgendaCategory = await AgendaCategoryModel.findById(
//       args.id
//     ).lean();

//     // If the AgendaCategory is not found, throw a NotFoundError
//     if (!existingAgendaCategory) {
//       throw new errors.NotFoundError(
//         requestContext.translate(AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE),
//         AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
//         AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM
//       );
//     }
//     const currentOrg = await AgendaCategoryModel.findById(
//       existingAgendaCategory._id
//     )
//       .populate("organization")
//       .select("organization")
//       .lean();

//     const orgId = currentOrg?._id;

//     const currentUserIsOrgAdmin = currentUser.adminFor.some(
//       (organizationId) =>
//         organizationId === currentOrg?._id ||
//         Types.ObjectId(organizationId).equals(organizationId)
//     );
//     // If the user is a normal user, throw an error
//     if (
//       currentUserIsOrgAdmin === false &&
//       currentUser.userType !== "SUPERADMIN"
//     ) {
//       throw new errors.UnauthorizedError(
//         USER_NOT_AUTHORIZED_ERROR.MESSAGE,
//         USER_NOT_AUTHORIZED_ERROR.CODE,
//         USER_NOT_AUTHORIZED_ERROR.PARAM
//       );
//     }

//     // Update the AgendaCategory
//     const updatedAgendaCategory = await AgendaCategoryModel.findByIdAndUpdate(
//       args.id,
//       {
//         $set: {
//           updatedBy: context.userId,
//           ...(args.input as any),
//         },
//       },
//       {
//         new: true,
//       }
//     ).lean();
//     return updatedAgendaCategory!;
//   };
