import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Event } from "../../../src/models";
import type { QueryEventsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testOrganization = temp[1];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventsByOrganization", () => {
  it(`returns list of all existing events sorted by ascending order of event._id
  if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

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
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganizationInfo);
  });
});
