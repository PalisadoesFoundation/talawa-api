import { getAllAgendaItems } from "../../../src/resolvers/Query/getAllAgendaItems";
// import { createTestUser } from "../../helpers/userAndOrg";
// import type {
//   TestUserType,
// } from "../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  // testUser = await createTestUser();
  // testAdminUser = await createTestUser();

  // testEvent = await Event.create({
  //   title: "title",
  //   description: "description",
  //   allDay: true,
  //   startDate: new Date(),
  //   recurring: true,
  //   isPublic: true,
  //   isRegisterable: true,
  //   creator: testUser?._id,
  //   creatorId : testUser?._id,
  //   admins: [testAdminUser?._id],
  //   registrants: [],
  //   organization: testOrganization?._id,
  // });
  // testAgendaItem = await AgendaItemModel.create({
  //   title: "Test Agenda Item",
  //   description: "This is a test agenda item",
  //   duration: "2 hours",
  //   createdAt: Date.now(),
  //   updatedAt: Date.now(),
  //   attachments: ["attachment1", "attachment2"],
  //   relatedEvent: testEvent?._id,
  //   createdBy: testAdminUser?._id,
  //   urls: ["url1", "url2"],
  //   user: "testuser",
  //   categories: [],
  //   sequence: 1,
  //   itemType: "Regular",
  //   organization: testOrganization?._id,
  //   isNote: false,
  // });
  // testAgendaItem2 = await AgendaItemModel.create({
  //   title: "Test Agenda Item 2 ",
  //   description: "This is a test agenda item 2",
  //   duration: "2 + 2 hours",
  //   createdAt: Date.now(),
  //   updatedAt: Date.now(),
  //   attachments: ["attachment12", "attachment22"],
  //   relatedEvent: testEvent?._id,
  //   createdBy: testAdminUser?._id,
  //   urls: ["url12", "url22"],
  //   user: "testuser",
  //   categories: [],
  //   sequence: 2,
  //   itemType: "Regular",
  //   organization: testOrganization?._id,
  //   isNote: false,
  // });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

it("resolvers -> Query -> getAllAgendaItems: returns all agenda items successfully", async () => {
  const result = await getAllAgendaItems?.({}, {}, {});
  expect(result).toBeDefined();
});

// it("resolvers -> Query -> getAllAgendaItems: handles error fetching agenda items", async () => {
//     // Mocking the AgendaItemModel.find to throw an error
//     const originalFind = AgendaItemModel.find;
//     AgendaItemModel.find = () => {
//         throw new Error("[Error: [Simulated error]]");
//     };

//     try {
//         await getAllAgendaItems?.({}, {}, {});
//     } catch (error) {
//         expect(error).toBe("Simulated error");
//     } finally {
//         // Restore the original implementation
//         AgendaItemModel.find = originalFind;
//     }
// });

it("resolvers -> Query -> getAllAgendaItems: handles different input scenarios", async () => {
  // Test with specific arguments
  const result1 = await getAllAgendaItems?.({ someKey: "someValue" }, {}, {});
  expect(result1).toBeDefined();

  // Test with empty arguments
  const result2 = await getAllAgendaItems?.({}, {}, {});
  expect(result2).toBeDefined();
});
