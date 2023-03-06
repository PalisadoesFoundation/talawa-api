import "dotenv/config";
import { Document } from "mongoose";
import {
  User,
  Organization,
  Event,
  EventProject,
  Interface_EventProject,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import {
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEvent, testEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testUserNotCreatorOfEventProject: testUserType;
let testEvent: testEventType;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEvent();
  testUser = temp[0];

  testUserNotCreatorOfEventProject = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
  testEvent = temp[2];
  testEventProject = await EventProject.create({
    title: "title",
    description: "description",
    creator: testUser!._id,
    admins: [testUser!._id],
    members: [testUser!._id],
    event: testEvent!._id,
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await EventProject.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(async () => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> removeEventProject", () => {
  it("Should throw an error if the user is not found", async () => {
    const args = {
      data: {
        eventId: null,
      },
    };

    const context = {
      userId: null,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    vi.doMock("../../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../../src/constants"
      );
      return {
        ...actualConstants,
      };
    });

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toBe(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });
  it("Should throw an error if the eventProject is not found", async () => {
    const args = {
      id: null,
    };

    const context = {
      userId: testUser!._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    vi.doMock("../../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../../src/constants"
      );
      return {
        ...actualConstants,
      };
    });

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_PROJECT_NOT_FOUND_MESSAGE);
      expect(error.message).toBe(
        `Translated ${EVENT_PROJECT_NOT_FOUND_MESSAGE}`
      );
    }
  });
  it("Should throw an error if the user is not the creator of the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUserNotCreatorOfEventProject!._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    vi.doMock("../../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../../src/constants"
      );
      return {
        ...actualConstants,
      };
    });

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toBe(`Translated ${USER_NOT_AUTHORIZED_MESSAGE}`);
    }
  });
  it("Should remove the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    await removeEventProject(null, args, context);

    const eventProject = await EventProject.findOne(testEventProject._id);

    expect(eventProject).toBeNull();
  });
});
