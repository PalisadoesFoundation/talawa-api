import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AgendaItemModel,
  Event,
  Organization,
  User,
} from "../../../src/models";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/AgendaItem/updatedBy";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";

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

describe("resolvers -> AgendaItem -> updatedBy", () => {
  it(`returns the updater for parent agendaItem`, async () => {
    const parent = testAgendaItem?.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
