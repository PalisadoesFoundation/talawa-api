import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/EventVolunteer/event";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerType,
} from "../../helpers/events";
import { createTestEventAndVolunteer } from "../../helpers/events";
import type { InterfaceEventVolunteer } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testEventVolunteer: TestEventVolunteerType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent, testEventVolunteer] = await createTestEventAndVolunteer();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventVolunteer -> event", () => {
  it(`returns the correct event object for parent event volunteer`, async () => {
    const parent = testEventVolunteer?.toObject();

    const eventPayload = await eventResolver?.(
      parent as InterfaceEventVolunteer,
      {},
      {},
    );

    expect(eventPayload).toEqual(testEvent?.toObject());
  });
});
