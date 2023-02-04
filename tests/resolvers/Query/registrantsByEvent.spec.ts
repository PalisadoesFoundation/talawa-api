import "dotenv/config";
import { registrantsByEvent as registrantsByEventResolver } from "../../../src/resolvers/Query/registrantsByEvent";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Event,
  Interface_Event,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { Document, Types } from "mongoose";
import { QueryRegistrantsByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  testEvent = await Event.create({
    creator: testUser._id,
    registrants: [
      {
        userId: testUser._id,
        user: testUser._id,
      },
    ],
    admins: [testUser._id],
    organization: testOrganization._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
        eventAdmin: testEvent._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
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
    const args: QueryRegistrantsByEventArgs = { id: testEvent._id };

    const registrantsByEventPayload = await registrantsByEventResolver?.(
      {},
      args,
      {}
    );

    const event = await Event.findOne({
      _id: testEvent._id,
    })
      .populate("registrants.user", "-password")
      .lean();

    const registrantsByEvent = event?.registrants.map((registrant) => {
      return registrant.user;
    });

    expect(registrantsByEventPayload).toEqual(registrantsByEvent);
  });
});
