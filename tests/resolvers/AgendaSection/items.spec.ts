import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { items as relatedAgendaItemsResolver } from "../../../src/resolvers/AgendaSection/items";
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
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAdminUser: TestUserType;
let testAgendaItem: TestAgendaItemType;
let testAgendaSection: TestAgendaSectionType; // Assuming you have TestAgendaSectionType defined

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
    title: "Test Agenda Item",
    description: "Description for the test agenda item",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // Ending time after 1 hour
    location: "Test Location",
    categoryId: new Types.ObjectId().toString(), // A random ID that does not exist in the database
    creator: testUser?._id,
    organization: testOrganization?._id,
    creatorId: testUser?._id,
    updatedAt: Date.now(),
    duration: "1 Hours",
  });

  testAgendaSection = await AgendaSectionModel.create({
    relatedEvent: testEvent?._id,
    description: "Test Agenda Section Description",
    items: [testAgendaItem?._id],
    sequence: 1,
    createdAt: new Date(),
    createdBy: testUser?._id,
    updatedAt: Date.now(),
  });

  await testAgendaSection?.updateOne({
    $push: {
      items: testAgendaItem?._id,
    },
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaSection -> agendaItems", () => {
  it(`returns the related agenda items for parent agendaSection`, async () => {
    const parent = testAgendaSection?.toObject();

    const relatedAgendaItemsPayload = await relatedAgendaItemsResolver?.(
      parent,
      {},
      {},
    );

    expect(relatedAgendaItemsPayload);
  });
});
