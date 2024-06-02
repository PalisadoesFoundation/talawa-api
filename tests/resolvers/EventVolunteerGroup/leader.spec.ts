import "dotenv/config";
import { leader as leaderResolver } from "../../../src/resolvers/EventVolunteerGroup/leader";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type { InterfaceEventVolunteerGroup } from "../../../src/models";
import { EventVolunteerGroup } from "../../../src/models";
import type { TestUserType } from "../../helpers/user";
import type { TestEventVolunteerGroupType } from "../Mutation/createEventVolunteer.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let eventAdminUser: TestUserType;
let testEvent: TestEventType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [eventAdminUser, , testEvent] = await createTestEvent();
  testGroup = await EventVolunteerGroup.create({
    name: "test",
    creatorId: eventAdminUser?._id,
    leaderId: eventAdminUser?._id,
    eventId: testEvent?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventVolunteer -> leader", () => {
  it(`returns the correct leader user object for parent event volunteer group`, async () => {
    const parent = testGroup?.toObject();

    const leaderPayload = await leaderResolver?.(
      parent as InterfaceEventVolunteerGroup,
      {},
      {},
    );

    expect(leaderPayload?._id).toEqual(eventAdminUser?._id);
  });
});
