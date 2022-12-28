import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  Interface_Event,
} from "../../../src/lib/models";
import { MutationUnregisterForEventByUserArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { unregisterForEventByUser as unregisterForEventByUserResolver } from "../../../src/lib/resolvers/Mutation/unregisterForEventByUser";
import {
  EVENT_NOT_FOUND,
  USER_ALREADY_UNREGISTERED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

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
    members: [testUser._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testEvent = await Event.create({
    creator: testUser._id,
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
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> unregisterForEventByUser", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if current user with _id === context.userId is
  not a registrant of event with _id === args.id`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent._id,
      };

      const context = {
        userId: testUser._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`unregisters current user with _id === context.userId from event with
  _id === args.id`, async () => {
    await Event.updateOne(
      {
        _id: testEvent._id,
      },
      {
        $push: {
          registrants: {
            userId: testUser._id,
            user: testUser._id,
            status: "ACTIVE",
          },
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $push: {
          registeredEvents: testEvent._id,
        },
      }
    );

    const args: MutationUnregisterForEventByUserArgs = {
      id: testEvent._id,
    };

    const context = {
      userId: testUser._id,
    };

    const unregisterForEventByUserPayload =
      await unregisterForEventByUserResolver?.({}, args, context);

    const testUnregisterForEventByUserPayload = await Event.findOne({
      _id: testEvent._id,
    }).lean();

    expect(unregisterForEventByUserPayload).toEqual(
      testUnregisterForEventByUserPayload
    );
  });

  it(`throws NotFoundError if current user with _id === context.userId has
  already unregistered from the event with _id === args.id`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent._id,
      };

      const context = {
        userId: testUser._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_UNREGISTERED);
    }
  });
});
