import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { getAgendaItem } from "../../../src/resolvers/Query/agendaItemById";
import { AgendaItemModel, Organization, Event } from "../../../src/models";
import { AGENDA_ITEM_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaItem: TestAgendaItemType;
let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    creatorId: testUser?._id,
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
    creatorId: testUser?._id,
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

describe("resolvers -> Query -> getAgendaItem", () => {
  it("throws NotFoundError if no agenda item exists with the given ID", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };

      if (getAgendaItem) {
        await getAgendaItem({}, args, {});
      } else {
        throw new Error("getAgendaItem resolver is undefined");
      }
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("returns the agenda item successfully if the user is authorized", async () => {
    const args = {
      id: testAgendaItem._id.toString(),
    };
    if (getAgendaItem) {
      const result = await getAgendaItem({}, args, {});

      expect(result).toBeDefined();
      expect(result?._id).toEqual(testAgendaItem._id);
    } else {
      throw new Error("getAgendaItem resolver is undefined");
    }
  });
});
