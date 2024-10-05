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
    creator: eventAdminUser?._id,
    leader: eventAdminUser?._id,
    event: testEvent?._id,
  });
  testEventVolunteer = await EventVolunteer.create({
    event: testEvent?._id,
    user: testUser?._id,
    creator: eventAdminUser?._id,
    group: testGroup?._id,
    hasAccepted: false,
    isPublic: false,
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
