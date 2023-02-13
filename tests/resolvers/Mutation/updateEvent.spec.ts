import "dotenv/config";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import { MutationUpdateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import {
  EVENT_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";
import { testEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testEvent: testEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];
  testEvent = await Event.create({
    creator: testUser!._id,
    registrants: [{ userId: testUser!._id, user: testUser!._id }],
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $set: {
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
      },
    }
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${EVENT_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
    }
  });

  it(`updates the event with _id === args.id and returns the updated event`, async () => {
    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $push: {
          eventAdmin: testEvent!._id,
        },
      }
    );

    const args: MutationUpdateEventArgs = {
      id: testEvent!._id,
      data: {
        allDay: false,
        description: "newDescription",
        endDate: new Date().toUTCString(),
        endTime: new Date().toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        startDate: new Date().toUTCString(),
        startTime: new Date().toUTCString(),
        title: "newTitle",
        recurrance: "DAILY",
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testUpdateEventPayload = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(updateEventPayload).toEqual(testUpdateEventPayload);
  });
});
