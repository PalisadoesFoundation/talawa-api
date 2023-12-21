import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceEventProject } from "../../../src/models";
import { User, Organization, Event, EventProject } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";

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
  EVENT_PROJECT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testEvent: TestEventType;
let testEventProject: InterfaceEventProject &
  Document<any, any, InterfaceEventProject>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEvent();
  testUser = await createTestUserFunc();
  testAdminUser = temp[0];
  testEvent = temp[2];

  testEventProject = await EventProject.create({
    title: "Event Project title",
    description: "Event Project Description",
    event: testEvent?._id,
    createdBy: testAdminUser?._id,
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
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
        id: Types.ObjectId().toString(),
        data: {
          title: "New Title",
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
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
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
        data: {
          title: "New title",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );

      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE}`
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
        data: {
          title: "New Title",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateEventProject: updateEventProjectResolver } = await import(
        "../../../src/resolvers/Mutation/updateEventProject"
      );

      await updateEventProjectResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
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
      userId: testAdminUser?._id,
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
