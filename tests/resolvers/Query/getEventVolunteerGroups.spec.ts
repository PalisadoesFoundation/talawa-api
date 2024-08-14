import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { getEventVolunteerGroups } from "../../../src/resolvers/Query/getEventVolunteerGroups";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
} from "../../helpers/events";
import { createTestEventVolunteerGroup } from "../../helpers/events";
import type { EventVolunteerGroup } from "../../../src/types/generatedGraphQLTypes";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testEventVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventVolunteerGroup();
  testEvent = temp[2];
  testEventVolunteerGroup = temp[4];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getEventVolunteerGroups", () => {
  it(`returns list of all existing event volunteer groups with eventId === args.where.eventId`, async () => {
    const volunteerGroupsPayload = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
        },
      },
      {},
    )) as unknown as EventVolunteerGroup[];

    expect(volunteerGroupsPayload[0]._id).toEqual(testEventVolunteerGroup._id);
  });

  it(`returns empty list of all existing event volunteer groups with eventId !== args.where.eventId`, async () => {
    const volunteerGroupsPayload = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          eventId: "123456789012345678901234",
        },
      },
      {},
    )) as unknown as EventVolunteerGroup[];

    expect(volunteerGroupsPayload).toEqual([]);
  });
});
