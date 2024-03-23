import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { getAgendaSection } from "../../../src/resolvers/Query/getAgendaSection";
import {
  AgendaItemModel,
  AgendaSectionModel,
  Organization,
  Event,
} from "../../../src/models";
import { AGENDA_SECTION_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaSectionType } from "../../helpers/agendaSection";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaItem: TestAgendaItemType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAgendaSection: TestAgendaSectionType;
let testAgendaItem2: TestAgendaItemType;

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
    creatorId: testUser?._id,
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
    creatorId: testUser?._id,
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
  testAgendaItem2 = await AgendaItemModel.create({
    title: "Test Agenda Item 2 ",
    description: "This is a second  test agenda item",
    duration: "2 hours",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments: ["attachment1", "attachment2"],
    relatedEvent: testEvent?._id,
    createdBy: testAdminUser?._id,
    urls: ["url1", "url2"],
    user: "testuser",
    categories: [],
    sequence: 2,
    itemType: "Regular",
    organization: testOrganization?._id,
    isNote: false,
  });
  testAgendaSection = await AgendaSectionModel.create({
    createdBy: testAdminUser?._id,
    description: "Test Agenda Section",
    relatedEvent: testEvent?._id,
    items: [testAgendaItem, testAgendaItem2],
    sequence: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getAgendaSection", () => {
  it("throws NotFoundError if no agenda section exists with the given ID", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };

      await getAgendaSection?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("returns the agenda section successfully if it exists", async () => {
    const args = {
      id: testAgendaSection._id,
    };

    const result = await getAgendaSection?.({}, args, {});
    expect(result).toBeDefined();

    expect(result?._id).toEqual(testAgendaSection?._id);
  });
});
