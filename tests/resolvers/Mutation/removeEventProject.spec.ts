import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import type { InterfaceEventProject } from "../../../src/models";
import { User, Organization, Event, EventProject } from "../../../src/models";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../helpers/db";

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
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  EVENT_PROJECT_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUserNotCreatorOfEventProject: TestUserType;
let testEvent: TestEventType;
let testEventProject: InterfaceEventProject &
  Document<any, any, InterfaceEventProject>;

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
    creator: testUser?._id,
    admins: [testUser?._id],
    members: [testUser?._id],
    event: testEvent?._id,
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await EventProject.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
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

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toBe(`Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`);
    }
  });
  it("Should throw an error if the eventProject is not found", async () => {
    const args = {
      id: null,
    };

    const context = {
      userId: testUser?._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toBe(
        `Translated ${EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
  it("Should throw an error if the user is not the creator of the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUserNotCreatorOfEventProject?._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    try {
      await removeEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toBe(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });
  it("Should remove the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    await removeEventProject(null, args, context);

    const eventProject = await EventProject.findOne(testEventProject._id);

    expect(eventProject).toBeNull();
  });
});
