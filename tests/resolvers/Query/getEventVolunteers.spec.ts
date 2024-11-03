import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
  TestEventVolunteerType,
} from "../../helpers/events";
import type { TestUserType } from "../../helpers/user";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceEventVolunteer } from "../../../src/models";
import { getEventVolunteers } from "../../../src/resolvers/Query/getEventVolunteers";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testEventVolunteer1: TestEventVolunteerType;
let testVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [, event, user1, , volunteer1, , volunteerGroup, ,] =
    await createVolunteerAndActions();

  testEvent = event;
  testUser1 = user1;
  testEventVolunteer1 = volunteer1;
  testVolunteerGroup = volunteerGroup;
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getEventVolunteers", () => {
  it(`getEventVolunteers - eventId, name_contains`, async () => {
    const eventVolunteers = (await getEventVolunteers?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
          name_contains: testUser1?.firstName,
        },
      },
      {},
    )) as unknown as InterfaceEventVolunteer[];
    expect(eventVolunteers[0].user.firstName).toEqual(testUser1?.firstName);
  });
  it(`getEventVolunteers - eventId, groupId`, async () => {
    const eventVolunteers = (await getEventVolunteers?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
          groupId: testVolunteerGroup?._id,
        },
      },
      {},
    )) as unknown as InterfaceEventVolunteer[];
    expect(eventVolunteers[0]._id).toEqual(testEventVolunteer1?._id);
  });
});
