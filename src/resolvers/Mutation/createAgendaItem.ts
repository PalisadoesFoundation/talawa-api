// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { User, Organization, AgendaItemModel } from "../../models";
// import {
//   USER_NOT_FOUND_ERROR,
//   ORGANIZATION_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
// } from "../../constants";
// import { Types } from "mongoose";
// import { adminCheck, superAdminCheck } from "../../utilities";

// /**
//  * Create an agenda item based on the provided input.
//  *
//  * @param _parent - The parent of the current request.
//  * @param args - The payload provided with the request.
//  * @param context - The context of the entire application.
//  * @throws {NotFoundError} - If the user, organization, or agenda category is not found.
//  * @throws {UnauthorizedError} - If the user is not authorized to perform the operation.
//  * @returns The created agenda item.
//  */
// export const createAgendaItem: MutationResolvers["createAgendaItem"] = async (
//   _parent,
//   args,
//   context
// ) => {
//   const userId = context.userId;
//   const currentUser = await User.findById(userId).lean();

//   if (!currentUser) {
//     throw new errors.NotFoundError(
//       requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//       USER_NOT_FOUND_ERROR.CODE,
//       USER_NOT_FOUND_ERROR.PARAM
//     );
//   }

//   const organizationId = args.input.organization;
//   const organization = await Organization.findById(organizationId).lean();

//   if (!organization) {
//     throw new errors.NotFoundError(
//       requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
//       ORGANIZATION_NOT_FOUND_ERROR.CODE,
//       ORGANIZATION_NOT_FOUND_ERROR.PARAM
//     );
//   }

//   const isEventAdmin = currentUser.eventAdmin.some(
//     (eventId) => eventId.toString() === args.input.relatedEvent
//   );

//   const hasAdminPermissions =
//     currentUser.adminFor.includes(organizationId) ||
//     currentUser.userType === "SUPERADMIN";

//   if (!hasAdminPermissions || isEventAdmin) {
//     throw new errors.UnauthorizedError(
//       requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
//       USER_NOT_AUTHORIZED_ERROR.CODE,
//       USER_NOT_AUTHORIZED_ERROR.PARAM
//     );
//   }

//   const categoryId = args.input?.categories as string | undefined;
//   const category = categoryId ? Types.ObjectId(categoryId) : undefined;

//   const createdAgendaItem = await AgendaItemModel.create({
//     ...args.input,
//     createdBy: currentUser._id,
//     category: category,
//     updatedAt: new Date(),
//     createdAt: new Date(),
//   });

//   // Add the createdAgendaItem._id to the appropriate lists on currentUser's document
//   await updateUserAgendaItems(
//     currentUser._id.toString(),
//     createdAgendaItem._id
//   );
//   return createdAgendaItem.toObject();
// };

// /**
//  * Update the lists of agenda items on the user's document.
//  *
//  * @param userId - The ID of the user.
//  * @param agendaItemId - The ID of the agenda item to be added to the user's lists.
//  */
// async function updateUserAgendaItems(userId: string, agendaItemId: string) {
//   await User.updateOne(
//     {
//       _id: userId,
//     },
//     {
//       $push: {
//         createdAgendaItems: agendaItemId,
//       },
//     }
//   );
// }
