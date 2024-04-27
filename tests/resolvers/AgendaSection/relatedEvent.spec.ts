import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { relatedEvent as relatedEventResolver } from "../../../src/resolvers/AgendaSection/relatedEvent";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  Event,
  Organization,
  AgendaItemModel,
  AgendaSectionModel,
} from "../../../src/models";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import type { TestAgendaSectionType } from "../../helpers/agendaSection";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAdminUser: TestUserType;
let testAgendaItem: TestAgendaItemType;
let testAgendaSection: TestAgendaSectionType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id, testUser?._id],
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
    title: "Regular Agenda Item",
    description: "Description for the regular agenda item",
    duration: "1 hour",
    relatedEventId: testEvent?._id,
    sequence: 1,
    itemType: "Regular",
    organizationId: testOrganization?._id,
    isNote: false,
    createdBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedBy: testAdminUser?._id,
    updatedAt: Date.now(),
  });

  testAgendaSection = await AgendaSectionModel.create({
    createdBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: testAdminUser?._id,
    items: [testAgendaItem?._id],
    sequence: 1,
    description: "Sample description...",
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaSection -> relatedEvent", () => {
  it(`returns the relatedEvent object for parent agendaSection`, async () => {
    const parent = testAgendaSection?.toObject();

    const relatedEventPayload = await relatedEventResolver?.(parent, {}, {});

    expect(relatedEventPayload);
  });
});
