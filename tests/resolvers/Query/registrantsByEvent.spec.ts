import "dotenv/config";
import { registrantsByEvent as registrantsByEventResolver } from "../../../src/resolvers/Query/registrantsByEvent";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Event } from "../../../src/models";
import { Types } from "mongoose";
import { QueryRegistrantsByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { testEventType, createEventWithRegistrant } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testEvent: testEventType;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
  testEvent = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> registrantsByEvent", () => {
  it("throws NotFoundError if no event exists with _id === args.id", async () => {
    try {
      const args: QueryRegistrantsByEventArgs = {
        id: Types.ObjectId().toString(),
      };

      await registrantsByEventResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it("returns list of all registrants for event with _id === args.id", async () => {
    const args: QueryRegistrantsByEventArgs = { id: testEvent?._id };

    const registrantsByEventPayload = await registrantsByEventResolver?.(
      {},
      args,
      {}
    );

    const event = await Event.findOne({
      _id: testEvent?._id,
    })
      .populate("registrants.user", "-password")
      .lean();

    const registrantsByEvent = event?.registrants.map((registrant) => {
      return registrant.user;
    });

    expect(registrantsByEventPayload).toEqual(registrantsByEvent);
  });
});
