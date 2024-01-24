import { getAllAgendaItems } from "../../../src/resolvers/Query/AgendaItems";
import {
  Organization,
  Event,
  AgendaItemModel,
  AgendaSectionModel,
} from "../../../src/models";
import { USER_NOT_AUTHORIZED_ERROR } from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import type { MutationCreateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  Test,
  vi,
  test,
} from "vitest";
import type { TestEventType } from "../../helpers/events";
import { agendaCategories } from "../../../src/resolvers/Query/getAllAgendaCategories";
import { getAllAgendaSections } from "../../../src/resolvers/Query/getAllAgendaSections";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaSection: any;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;
let testAgendaItem: any;
let testAgendaItem2: any;
let testAgendaSection2: any;

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
  testAgendaSection2 = await AgendaSectionModel.create({
    createdBy: testAdminUser?._id,
    description: "Test Agenda Section2",
    relatedEvent: testEvent?._id,
    items: [testAgendaItem, testAgendaItem2],
    sequence: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers -> Query -> getAllAgendaSections", () => {
  it("resolvers -> Query -> getAllAgendaSections: returns all agenda Section successfully", async () => {
    const result = await getAllAgendaSections?.({}, {}, {});
    expect(result).toBeDefined();
  });

  it("resolvers -> Query -> getAllAgendaCategories: handles different input scenarios", async () => {
    // Test with specific arguments
    const result1 = await getAllAgendaSections?.(
      { someKey: "someValue" },
      {},
      {}
    );
    expect(result1).toBeDefined();

    // Test with empty arguments
    const result2 = await getAllAgendaSections?.({}, {}, {});
    expect(result2).toBeDefined();
  });
});
