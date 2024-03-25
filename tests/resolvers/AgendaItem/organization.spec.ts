import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { organization as organizationResolver } from "../../../src/resolvers/AgendaItem/organization";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Event, Organization, AgendaItemModel } from "../../../src/models";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAdminUser: TestUserType;
let testAgendaItem: TestAgendaItemType;

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
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaItem -> organization", () => {
  it(`returns the organization object for parent agendaItem`, async () => {
    const parent = testAgendaItem?.toObject();

    const orgPayload = await organizationResolver?.(parent, {}, {});

    expect(orgPayload);
  });
});
