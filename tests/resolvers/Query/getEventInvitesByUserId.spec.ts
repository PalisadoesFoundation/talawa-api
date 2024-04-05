import "dotenv/config";
import { EventAttendee } from "../../../src/models";
import type { QueryGetEventInvitesByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestEventType } from "../../helpers/events";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testUser2: TestUserType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUser();
  testUser2 = await createTestUser();
  [, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe(`resolvers -> Query -> getEventAttendeeByEventId `, () => {
  it(`returns list of all invites of an event`, async () => {
    await EventAttendee.deleteOne({
      eventId: testEvent?._id,
    });

    await EventAttendee.create({
      userId: testUser1?._id,
      eventId: testEvent?._id,
    });
    await EventAttendee.create({
      userId: testUser2?._id,
      eventId: testEvent?._id,
    });

    const args: QueryGetEventInvitesByUserIdArgs = {
      userId: testUser1?.id,
    };

    const { getEventInvitesByUserId } = await import(
      "../../../src/resolvers/Query/getEventInvitesByUserId"
    );

    const getEventAttendeeByEventIdPayload = await getEventInvitesByUserId?.(
      {},
      args,
      {},
    );

    const eventAttendeesPayload = await EventAttendee.find({
      userId: testUser1?._id,
      isInvited: true,
    }).lean();

    expect(getEventAttendeeByEventIdPayload).toMatchObject(
      eventAttendeesPayload,
    );
  });
});
