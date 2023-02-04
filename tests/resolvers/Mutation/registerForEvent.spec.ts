import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  Interface_Event,
} from "../../../src/models";
import { MutationRegisterForEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { registerForEvent as registerForEventResolver } from "../../../src/resolvers/Mutation/registerForEvent";
import {
  EVENT_NOT_FOUND,
  REGISTRANT_ALREADY_EXIST,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

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
    registrants: [
      {
        userId: testUser.id,
        user: testUser._id,
        status: "ACTIVE",
      },
    ],
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

describe("resolvers -> Mutation -> registerForEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRegisterForEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationRegisterForEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
      };

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if user with _id === context.userId is already a
  registrant of event with _id === args.id and event.registrant.status === "ACTIVE"
  for the registrant with registrant.userId === context.userId
  `, async () => {
    try {
      const args: MutationRegisterForEventArgs = {
        id: testEvent._id,
      };

      const context = {
        userId: testUser._id,
      };

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(REGISTRANT_ALREADY_EXIST);
    }
  });

  it(`if user with _id === context.userId is already a registrant for event with _id === args.id
  sets event.registrant.status field to "ACTIVE" for registrant with
  _id === context.userId`, async () => {
    await Event.updateOne(
      {
        _id: testEvent._id,
      },
      {
        $set: {
          registrants: [
            {
              userId: testUser.id,
              user: testUser._id,
              status: "BLOCKED",
            },
          ],
        },
      }
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent._id,
    };

    const context = {
      userId: testUser._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context
    );

    const testRegisterForEventPayload = await Event.findOne({
      _id: testEvent._id,
    }).lean();

    expect(registerForEventPayload).toEqual(testRegisterForEventPayload);
  });

  it(`registers user with _id === context.userId as a registrant for event with
  _id === args.id`, async () => {
    await Event.updateOne(
      {
        _id: testEvent._id,
      },
      {
        $set: {
          registrants: [],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $set: {
          registeredEvents: [],
        },
      }
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent._id,
    };

    const context = {
      userId: testUser._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context
    );

    const testRegisterForEventPayload = await Event.findOne({
      _id: testEvent._id,
    }).lean();

    expect(registerForEventPayload).toEqual(testRegisterForEventPayload);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent._id]);
  });
});
