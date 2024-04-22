import "dotenv/config";
import { Event } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryEventsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createEventWithRegistrant } from "../../helpers/events";
import type mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testEvent1 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testEvent2 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventsByOrganization", () => {
  it(`returns list of all existing events sorted by ascending order of event._id
  if args.orderBy === 'id_ASC'`, async () => {
    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "id_ASC",
    };
    const { eventsByOrganization } = await import(
      "../../../src/resolvers/Query/eventsByOrganization"
    );
    const eventsByOrganizationPayload = await eventsByOrganization?.(
      {},
      args,
      {},
    );

    const eventsByOrganizationInfo = await Event.find({
      organization: testOrganization?._id,
    })
      .sort({
        _id: 1,
      })
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganizationInfo);
  });
});
