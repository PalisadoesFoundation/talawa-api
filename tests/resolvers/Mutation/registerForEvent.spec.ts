import "dotenv/config";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import { MutationRegisterForEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { registerForEvent as registerForEventResolver } from "../../../src/resolvers/Mutation/registerForEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { TestUserType } from "../../helpers/userAndOrg";
import { TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventWithRegistrants();
  testUser = temp[0];
  const testOrganization = temp[1];

  testEvent = await Event.create({
    creator: testUser!._id,
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
    registrants: [
      {
        userId: testUser!.id,
        user: testUser!._id,
        status: "ACTIVE",
      },
    ],
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $set: {
        createdEvents: [testEvent._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> registerForEvent", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRegisterForEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRegisterForEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if user with _id === context.userId is already a
  registrant of event with _id === args.id and event.registrant.status === "ACTIVE"
  for the registrant with registrant.userId === context.userId
  `, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRegisterForEventArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE);
      expect(error.message).toEqual(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE);
    }
  });

  it(`if user with _id === context.userId is already a registrant for event with _id === args.id
  sets event.registrant.status field to "ACTIVE" for registrant with
  _id === context.userId`, async () => {
    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $set: {
          registrants: [
            {
              userId: testUser!.id,
              user: testUser!._id,
              status: "BLOCKED",
            },
          ],
        },
      }
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context
    );

    const testRegisterForEventPayload = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(registerForEventPayload).toEqual(testRegisterForEventPayload);
  });

  it(`registers user with _id === context.userId as a registrant for event with
  _id === args.id`, async () => {
    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $set: {
          registrants: [],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $set: {
          registeredEvents: [],
        },
      }
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context
    );

    const testRegisterForEventPayload = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(registerForEventPayload).toEqual(testRegisterForEventPayload);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent!._id]);
  });
});
