// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { AgendaCategoryModel, User, Organization } from "../../models";
// import {
//   AGENDA_CATEGORY_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
//   USER_NOT_FOUND_ERROR,
// } from "../../constants";
// import { Types } from "mongoose";
// /* eslint-disable */
// /**
//  * Resolver function for the GraphQL mutation 'deleteAgendaCategory'.
//  *
//  * This resolver deletes an agenda category if the user has the necessary permissions.
//  *
//  * @param {Object} _parent - The parent object, not used in this resolver.
//  * @param {Object} args - The input arguments for the mutation.
//  * @param {Object} context - The context object containing user information.
//  * @returns {Promise<string>} A promise that resolves to the ID of the deleted agenda category.
//  * @throws {NotFoundError} Throws an error if the user or agenda category is not found.
//  * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
//  * @throws {InternalServerError} Throws an error for other potential issues during agenda category deletion.
//  */
// /* eslint-enable */
// export const deleteAgendaCategory: MutationResolvers["deleteAgendaCategory"] =
//   async (_parent, args, context) => {
//     const categoryId = args.id;
//     const agendaCategory = await AgendaCategoryModel.findById(args.id);

//     const userId = context.userId;

//     // Fetch the user to get the organization ID
//     const currentUser = await User.findById(userId);

//     // If the user is not found, throw a NotFoundError
//     if (!currentUser) {
//       throw new errors.NotFoundError(
//         USER_NOT_FOUND_ERROR.MESSAGE,
//         USER_NOT_FOUND_ERROR.CODE,
//         USER_NOT_FOUND_ERROR.PARAM
//       );
//     }
//     if (!agendaCategory) {
//       throw new errors.NotFoundError(
//         AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
//         AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
//         AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     const currentOrg = await AgendaCategoryModel.findById(agendaCategory._id)
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

//     await AgendaCategoryModel.findByIdAndDelete(args.id);
//     return categoryId;
//   };
