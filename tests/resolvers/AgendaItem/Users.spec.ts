import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AgendaItemModel, Organization, Event } from "../../../src/models";
import { users as usersResolver } from "../../../src/resolvers/AgendaItem/Users";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testAgendaItem: TestAgendaItemType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUser();
  testUser2 = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser1?._id,
    admins: [testUser1?._id, testUser2?._id],
    members: [testUser1?._id, testUser2?._id],
    creatorId: testUser1?._id,
  });
  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser1?._id,
    admins: [testUser1?._id, testUser2?._id],
    registrants: [],
    organization: testOrganization?._id,
    creatorId: testUser1?._id,
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
    createdBy: testUser1?._id,
    createdAt: Date.now(),
    updatedBy: testUser1?._id,
    updatedAt: Date.now(),
    users: [testUser1?._id, testUser2?._id], // Assuming users field is an array of user ids
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaItem -> Users", () => {
  it("Should return the users of the agenda item", async () => {
    const users = await usersResolver?.(testAgendaItem, {}, {});
    expect(users).toEqual([testUser1, testUser2]);
  });
});
