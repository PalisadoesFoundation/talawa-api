import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { createdBy as createdByResolver } from "../../../src/resolvers/AgendaItem/createdBy";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  User,
  Event,
  Organization,
  AgendaItemModel,
} from "../../../src/models";
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
let testSuperAdmin: TestUserType;
let testAdminUser: TestUserType;
let testAgendaItem: TestAgendaItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testSuperAdmin = await createTestUser();
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

  testSuperAdmin = await User.findOneAndUpdate(
    {
      _id: testSuperAdmin?._id,
    },
    {
      userType: "SUPERADMIN",
    },
    {
      new: true,
    },
  );

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

describe("resolvers -> AgendaItem -> createdBy", () => {
  it(`returns the creator for parent agendaItem`, async () => {
    const parent = testAgendaItem?.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
