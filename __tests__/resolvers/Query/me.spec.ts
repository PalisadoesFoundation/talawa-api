import "dotenv/config";
import { me as meResolver } from "../../../src/lib/resolvers/Query/me";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND } from "../../../src/constants";
import {
  Interface_User,
  User,
  Organization,
  Event,
} from "../../../src/lib/models";
import { nanoid } from "nanoid";
import { Document, Types } from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: (Interface_User & Document<any, any, Interface_User>) | null;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
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

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testEvent = await Event.create({
    creator: testUser._id,
    registrants: [{ userId: testUser._id, user: testUser._id }],
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
      $set: {
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
        eventAdmin: [testEvent._id],
      },
    }
  );
});

afterAll(async () => {
  disconnect();
});

describe("resolvers -> Query -> me", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await meResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns user object with populated fields createdOrganizations
    , createdEvents, joinedOrganizations, registeredEvents, eventAdmin,
    adminFor`, async () => {
    const context = {
      userId: testUser!._id,
    };

    const mePayload = await meResolver?.({}, {}, context);

    const user = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .populate("createdOrganizations")
      .populate("createdEvents")
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .populate("eventAdmin")
      .populate("adminFor")
      .lean();

    expect(mePayload).toEqual(user);
  });
});
