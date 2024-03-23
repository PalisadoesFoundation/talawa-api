import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { categories as relatedCategoriesResolver } from "../../../src/resolvers/AgendaItem/categories";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  Event,
  Organization,
  AgendaItemModel,
  AgendaCategoryModel,
} from "../../../src/models";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAdminUser: TestUserType;
let testAgendaItem: TestAgendaItemType;
let testAgendaCategory: TestAgendaCategoryType; // Assuming you have TestAgendaCategoryType defined

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

  testAgendaCategory = await AgendaCategoryModel.create({
    description: "Description for the test agenda category",
    createdBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedBy: testAdminUser?._id,
    updatedAt: Date.now(),
    name: "Test Agenda Category",
    organizationId: testOrganization?._id,
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

  await testAgendaItem?.updateOne({
    $push: {
      categories: testAgendaCategory?._id,
    },
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaItem -> relatedCategories", () => {
  it(`returns the related categories for parent agendaItem`, async () => {
    const parent = testAgendaItem?.toObject();

    const relatedCategoriesPayload = await relatedCategoriesResolver?.(
      parent,
      {},
      {},
    );

    expect(relatedCategoriesPayload);
    // You may also want to add assertions to check specific properties of the related categories if needed
  });
});
