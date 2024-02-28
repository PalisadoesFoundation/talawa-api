// import "dotenv/config";
// import type mongoose from "mongoose";
// import { Types } from "mongoose";
// import { User, AgendaItemModel, Organization, Event } from "../../../src/models";
// import type { MutationRemoveAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
// import { connect, disconnect } from "../../helpers/db";
// import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
// import { removeAgendaItem } from "../../../src/resolvers/Mutation/removeAgendaItem";
// import {
//   USER_NOT_FOUND_ERROR,
//   AGENDA_ITEM_NOT_FOUND_ERROR,
//   UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR,
// } from "../../../src/constants";
// import { createTestUser } from "../../helpers/userAndOrg";

// let testUser: TestUserType;
// let testAdminUser: TestUserType;
// let MONGOOSE_INSTANCE: typeof mongoose;
// let testEvent: TestEventType;
// let testOrganization: TestOrganizationType;
// let testUserSuperAdmin: TestUserType;
// let testAgendaItem: any;
// let testAgendaItem2: any;
// import type {
//   TestUserType,
//   TestOrganizationType,
// } from "../../helpers/userAndOrg";
// import type { TestEventType } from "../../helpers/eventsWithRegistrants";
// import { createTestEvent } from "../../helpers/events";

// beforeAll(async () => {
//   MONGOOSE_INSTANCE = await connect();
//   testUser = await createTestUser();
//   testAdminUser = await createTestUser();
//   testUserSuperAdmin = await createTestUser();
//   testOrganization = await Organization.create({
//     name: "name",
//     description: "description",
//     isPublic: true,
//     creator: testUser?._id,
//     admins: [testAdminUser?._id],
//     members: [testUser?._id, testAdminUser?._id],
//   });
//   const temp = await createTestEvent();
//   testEvent = temp[2];
//   await User.updateOne(
//     {
//       _id: testUser?._id,
//     },
//     {
//       $push: {
//         adminFor: testOrganization?._id,
//       },
//     }
//   );
//   testAgendaItem = await AgendaItemModel.create({
//     createdBy: testAdminUser?._id,
//     updatedAt: Date.now(),
//     createdAt: Date.now(),
//     title: "Test Item",
//     duration: "One hour",
//     relatedEvent: testEvent?._id,
//     sequence: 1,
//     itemType: "Regular",
//     isNote: false,
//   });
//   testAgendaItem2 = await AgendaItemModel.create({
//     createdBy: testAdminUser?._id,
//     updatedAt: Date.now(),
//     createdAt: Date.now(),
//     title: "Test Item2",
//     duration: "One hour",
//     relatedEvent: testEvent?._id,
//     sequence: 1,
//     itemType: "Regular",
//     isNote: false,
//   });
//   await User.updateOne(
//     {
//       _id: testAdminUser?._id,
//     },
//     {
//       $push: {
//         createdAgendaItems: [testAgendaItem, testAgendaItem2],
//       },
//     }
//   );
//   const { requestContext } = await import("../../../src/libraries");
//   vi.spyOn(requestContext, "translate").mockImplementation(
//     (message: any) => message
//   );
// });

// afterAll(async () => {
//   await disconnect(MONGOOSE_INSTANCE);
// });


// describe("resolvers -> Mutation -> removeAgendaItem", () => {
//     it("throws unknown error if no user exists with _id === userId", async () => {
//       try {
//         const args: MutationRemoveAgendaItemArgs = {
//           id: testAgendaItem?._id,
//         };
  
//         const context = {
//           userId: Types.ObjectId().toString(),
//         };
  
//         if (removeAgendaItem) {
//           await removeAgendaItem({}, args, context);
//         } else {
//           throw new Error("removeAgendaItem resolver is undefined");
//         }
//       } catch (error: unknown) {
//         if (error instanceof Error) {
//           expect(error.message).toEqual("An unknown error occurred.");
//         } else {
//           throw new Error("An unknown error occurred.");
//         }
//       }
//     });
  
//     it("throws unknown error if no agenda item exists with _id === args.id", async () => {
//       try {
//         const args: MutationRemoveAgendaItemArgs = {
//           id: Types.ObjectId().toString(),
//         };
  
//         const context = {
//           userId: testAdminUser?._id,
//         };
  
//         if (removeAgendaItem) {
//           await removeAgendaItem({}, args, context);
//         } else {
//           throw new Error("removeAgendaItem resolver is undefined");
//         }
//       } catch (error: unknown) {
//         if (error instanceof Error) {
//           expect(error.message).toEqual("An unknown error occurred.");
//         } else {
//           throw new Error("An unknown error occurred.");
//         }
//       }
//     });
  
//     it("throws unknown error if user is not the creator of the agenda item", async () => {
//       try {
//         const args: MutationRemoveAgendaItemArgs = {
//           id: testAgendaItem?._id,
//         };
  
//         const context = {
//           userId: testUser?._id,
//         };
  
//         if (removeAgendaItem) {
//           await removeAgendaItem({}, args, context);
//         } else {
//           throw new Error("removeAgendaItem resolver is undefined");
//         }
//       } catch (error: unknown) {
//         if (error instanceof Error) {
//           expect(error.message).toEqual("An unknown error occurred.");
//         } else {
//           throw new Error("An unknown error occurred.");
//         }
//       }
//     });
  
//     it("removes the agenda item if user is the creator", async () => {
//       const args: MutationRemoveAgendaItemArgs = {
//         id: testAgendaItem?._id,
//       };
  
//       const context = {
//         userId: testAdminUser?._id,
//       };
  
//       if (removeAgendaItem) {
//         try {
//           const result = await removeAgendaItem({}, args, context);
//           expect(result).toEqual(testAgendaItem?._id.toString());
  
//           // Check if the agenda item is removed from the database
//           const deletedAgendaItem = await AgendaItemModel.findOne({
//             _id: args.id,
//           });
//           expect(deletedAgendaItem).toBeNull();
  
         
//         } catch (error: unknown) {
//           if (error instanceof Error) {
//             throw error;
//           } else {
//             throw new Error("An unknown error occurred.");
//           }
//         }
//       } else {
//         throw new Error("removeAgendaItem resolver is undefined");
//       }
//     });
//   });
  
 