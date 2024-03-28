import "dotenv/config";
import { EventAttendee } from "../../../src/models";
import type { QueryGetEventAttendeeArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestEventType } from "../../helpers/events";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  [, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe(`resolvers -> Query -> getEventAttendeeByEventId `, () => {
  it(`returns list of all eventAttendees of event._id`, async () => {
    await EventAttendee.deleteOne({
      eventId: testEvent?._id,
    });

    await EventAttendee.create({
      userId: testUser?._id,
      eventId: testEvent?._id,
      isInvited: true,
      isRegistered: true,
    });

    const args: QueryGetEventAttendeeArgs = {
      eventId: testEvent?._id,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: testUser!._id.toString(),
    };

    const { getEventAttendee } = await import(
      "../../../src/resolvers/Query/getEventAttendee"
    );

    const getEventAttendeePayload = await getEventAttendee?.({}, args, {});

    const eventAttendee = await EventAttendee.findOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    }).lean();

    if (eventAttendee) {
      expect(getEventAttendeePayload).toMatchObject(eventAttendee);
    }
  });
});
