import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  User,
  Organization,
  Event,
  Interface_EventProject,
  EventProject,
} from "../../../src/models";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
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
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../../src/constants";
import { updateEventProject } from "../../../src/resolvers/Mutation/updateEventProject";
import { createTestUserFunc, testUserType } from "../../helpers/user";
import { createTestEvent, testEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testAdminUser: testUserType;
let testEvent: testEventType;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> createEventProject", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it("Should throw an error if the user is not found /IN_PRODUCTION=false ", async () => {
    try {
      const args = {
        data: {
          eventId: null,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_FOUND);
    }
  });

  it("Should throw an error if the user is not found /IN_PRODUCTION=true ", async () => {
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
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );
      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it("should throw an error when event is not found / IN_PRODUCTION= false", async () => {
    try {
      const args = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toBe(EVENT_PROJECT_NOT_FOUND);
    }
  });

  it("should throw an error when event is not found / IN_PRODUCTION=true", async () => {
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
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

  it("should throw an error if user is not admin of the event // IN_PRODUCTION=false", async () => {
    try {
      const args = {
        id: testEventProject.id.toString(),
      };
      const context = {
        userId: testUser!._id,
      };

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_AUTHORIZED);
    }
  });

  it("should throw an error if user is not admin of the event // IN_PRODUCTION=true", async () => {
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
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
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

    const updatedEventProjectObj = await updateEventProject?.(
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
