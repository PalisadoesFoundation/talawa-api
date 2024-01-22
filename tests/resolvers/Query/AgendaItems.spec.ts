import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { getAllAgendaItems } from "../../../src/resolvers/Query/AgendaItems";
import {
  User,
  AgendaItemModel,
  Organization,
  Event,
} from "../../../src/models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import type { TestEventType } from "../../helpers/events";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaItem: any;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
  });
  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
  });
  testAgendaItem = await AgendaItemModel.create({
    title: "Test Agenda Item",
    description: "This is a test agenda item",
    duration: "2 hours",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments: ["attachment1", "attachment2"],
    relatedEvent: testEvent?._id,
    createdBy: testAdminUser?._id,
    urls: ["url1", "url2"],
    user: "testuser",
    categories: [],
    sequence: 1,
    itemType: "Regular",
    organization: testOrganization?._id,
    isNote: false,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getAllAgendaItems", () => {
  it("throws NotFoundError if no user exists with the given ID", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (getAllAgendaItems) {
        await getAllAgendaItems({}, {}, context);
      } else {
        throw new Error("getAllAgendaItems resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if the user is not a super admin or admin", async () => {
    try {
      const context = {
        userId: testUser?._id,
      };

      if (getAllAgendaItems) {
        await getAllAgendaItems({}, {}, context);
      } else {
        throw new Error("getAllAgendaItems resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  // it("returns all agenda items successfully for a super admin", async () => {
  //   const superAdminUser = await createTestUser({ userType: "SUPERADMIN"});
  //   const context = {
  //     userId: superAdminUser?._id,
  //   };

  //   if (getAllAgendaItems) {
  //     const result = await getAllAgendaItems({}, {}, context);

  //     expect(result).toBeDefined();

  //   } else {
  //     throw new Error("getAllAgendaItems resolver is undefined");
  //   }
  // });

  it("returns all agenda items successfully for an admin", async () => {
    const context = {
      userId: testAdminUser?._id,
    };

    if (getAllAgendaItems) {
      const result = await getAllAgendaItems({}, {}, context);

      expect(result).toBeDefined();

      // You can add more assertions based on your data structure
    } else {
      throw new Error("getAllAgendaItems resolver is undefined");
    }
  });
});
