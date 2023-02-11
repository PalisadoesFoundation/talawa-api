import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  User,
  Organization,
  Event,
  Interface_EventProject,
  EventProject,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
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
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../../src/constants";
import { createTestUserFunc, testUserType } from "../../helpers/user";
import { createTestEvent, testEventType } from "../../helpers/events";
let testUser: testUserType;
let testAdminUser: testUserType;
let testEvent: testEventType;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeAll(async () => {
  await connect();
  const temp = await createTestEvent();
  testUser = await createTestUserFunc();
  testAdminUser = temp[0];
  testEvent = temp[2];

  testEventProject = await EventProject.create({
    title: "Event Project title",
    description: "Event Project Description",
    event: testEvent!._id,
    creator: testAdminUser!._id,
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await disconnect();
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> createEventProject", () => {
  it("Should throw an error if the user is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args = {
        data: {
          eventId: null,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );

      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it("should throw an error when event is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );

      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(EVENT_PROJECT_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EVENT_PROJECT_NOT_FOUND_MESSAGE}`
      );
    }
  });

  it("should throw an error if user is not admin of the event", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args = {
        id: testEventProject.id.toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );

      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
    }
  });

  it("should update the Event Project when all checks have passed", async () => {
    const args = {
      data: {
        title: "New Event Project title",
        description: "New Event Project Description",
      },
      id: testEventProject.id.toString(),
    };

    const context = {
      userId: testAdminUser!._id,
    };

    const { updateEventProject: updateEventProjectResolver } = await import(
      "../../../src/resolvers/Mutation/updateEventProject"
    );

    const updatedEventProjectObj = await updateEventProjectResolver?.(
      {},
      args,
      context
    );

    expect(updatedEventProjectObj).toEqual({
      ...testEventProject.toObject(),
      title: "New Event Project title",
      description: "New Event Project Description",
    });
  });
});
