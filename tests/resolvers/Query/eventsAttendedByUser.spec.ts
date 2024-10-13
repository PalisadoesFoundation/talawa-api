import "dotenv/config";
import type mongoose from "mongoose";
import { Event } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryEventsAttendedByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createEventWithRegistrant } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();

  await createEventWithRegistrant(testUser?._id, testOrganization?._id, true);
  await createEventWithRegistrant(testUser?._id, testOrganization?._id, true);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventsAttendedByUser", () => {
  it(`returns list of all events attended by user sorted by ascending order of event._id if args.orderBy === 'id_ASC'`, async () => {
    const args: QueryEventsAttendedByUserArgs = {
      id: testUser?._id,
      orderBy: "id_ASC",
    };

    const { eventsAttendedByUser } = await import(
      "../../../src/resolvers/Query/eventsAttendedByUser"
    );

    const eventsAttendedByUserPayload = await eventsAttendedByUser?.(
      {},
      args,
      {},
    );

    const eventsAttendedByUserInfo = await Event.find({
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort({ _id: 1 })
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .lean();

    expect(eventsAttendedByUserPayload).toEqual(eventsAttendedByUserInfo);
  });
});
