import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { eventVolunteersByEvent } from "../../../src/resolvers/Query/eventVolunteersByEvent";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import { createTestEventAndVolunteer } from "../../helpers/events";
import { EventVolunteer } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventAndVolunteer();
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> eventVolunteersByEvent", () => {
  it(`returns list of all existing event volunteers with eventId === args.id`, async () => {
    const volunteersPayload = await eventVolunteersByEvent?.(
      {},
      {
        id: testEvent?._id,
      },
      {}
    );

    const volunteers = await EventVolunteer.find({
      eventId: testEvent?._id,
    })
      .populate("userId", "-password")
      .lean();

    expect(volunteersPayload).toEqual(volunteers);
  });
});
