import "dotenv/config";
import { group as groupResolver } from "../../../src/resolvers/EventVolunteer/group";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";
import type {
  TestEventType,
  TestEventVolunteerType,
} from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { InterfaceEventVolunteer } from "../../../src/models";
import { EventVolunteer, EventVolunteerGroup } from "../../../src/models";
import type { TestEventVolunteerGroupType } from "../Mutation/createEventVolunteer.spec";
import { createTestUser } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEventVolunteer: TestEventVolunteerType;
let eventAdminUser: TestUserType;
let testUser: TestUserType;
let testEvent: TestEventType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [eventAdminUser, , testEvent] = await createTestEvent();
  testUser = await createTestUser();
  testGroup = await EventVolunteerGroup.create({
    name: "test",
    creatorId: eventAdminUser?._id,
    leaderId: eventAdminUser?._id,
    eventId: testEvent?._id,
  });
  testEventVolunteer = await EventVolunteer.create({
    eventId: testEvent?._id,
    userId: testUser?._id,
    creatorId: eventAdminUser?._id,
    groupId: testGroup?._id,
    isAssigned: false,
    isInvited: true,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventVolunteer -> group", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it(`returns the correct event volunteer group object for parent event volunteer`, async () => {
    const parent = testEventVolunteer?.toObject();
    const groupPayload = await groupResolver?.(
      parent as InterfaceEventVolunteer,
      {},
      {},
    );
    console.log(groupPayload);
    console.log(testGroup);

    expect(groupPayload?._id).toEqual(testGroup?._id);
  });
});
