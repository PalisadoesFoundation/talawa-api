import "dotenv/config";
import { Event, Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestEventType } from "../../helpers/events";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { Types } from "mongoose";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();
  testAdminUser = await createTestUser();

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    createdBy: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
  });

  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    }
  );
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
        data: {
          title: "Test Event",
          description: "Test Description",
          eventId: Types.ObjectId().toString(),
        },
      };

      const { createEventProject } = await import(
        "../../../src/resolvers/Mutation/createEventProject"
      );

      await createEventProject!({}, args, { user: null });
    } catch (err: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(err.message).toEqual(`Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`);
    }
  });

  it("Should throw an error if the event is not found", async () => {
    const args = {
      data: {
        title: "Test Event",
        description: "Test Description",
        eventId: Types.ObjectId().toString(),
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    try {
      await createEventProject!({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it("Should throw an error if the user is not an admin of the event", async () => {
    const args = {
      data: {
        title: "Test Event",
        description: "Test Description",
        eventId: testEvent!._id,
      },
    };
    const context = {
      userId: testUser?._id,
    };

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    try {
      await createEventProject!({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });
  it("Should create a project", async () => {
    const context = {
      userId: testAdminUser?._id,
    };

    const args = {
      data: {
        eventId: testEvent?._id,
        title: "title",
        description: "description",
        event: testEvent?._id,
        creator: context.userId,
      },
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    const result = await createEventProject!({}, args, context);

    expect(result).toHaveProperty("event", testEvent?._id);
    expect(result).toHaveProperty("title", args.data.title);
    expect(result).toHaveProperty("description", args.data.description);
    expect(result).toHaveProperty("event", testEvent?._id);
    expect(result).toHaveProperty("creator", context.userId);
  });
});
