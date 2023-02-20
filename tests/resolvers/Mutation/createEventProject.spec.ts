import "dotenv/config";
import { Event, Organization, User } from "../../../src/models";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
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
  EVENT_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { testEventType } from "../../helpers/events";
import {
  createTestUser,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testAdminUser: testUserType;
let testOrganization: testOrganizationType;
let testEvent: testEventType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);

  testUser = await createTestUser();
  testAdminUser = await createTestUser();

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser!._id,
    admins: [testAdminUser!._id],
    members: [testUser!._id, testAdminUser!._id],
  });

  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser!._id,
    admins: [testAdminUser!._id],
    registrants: [],
    organization: testOrganization!._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $push: {
        adminFor: testOrganization!._id,
      },
    }
  );
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(async () => {
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { createEventProject } = await import(
        "../../../src/resolvers/Mutation/createEventProject"
      );

      await createEventProject(null, args, { user: null });
    } catch (err: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(err.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it("Should throw an error if the event is not found", async () => {
    const args = {
      data: {
        eventId: null,
      },
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

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    try {
      await createEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${EVENT_NOT_FOUND_MESSAGE}`);
    }
  });

  it("Should throw an error if the user is not an admin of the event", async () => {
    const args = {
      data: {
        eventId: testEvent!._id,
      },
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

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    try {
      await createEventProject(null, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
    }
  });
  it("Should create a project", async () => {
    const context = {
      userId: testAdminUser!._id,
    };

    const args = {
      data: {
        eventId: testEvent!._id,
        title: "title",
        description: "description",
        event: testEvent!._id,
        creator: context.userId,
      },
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    const result = await createEventProject(null, args, context);

    expect(result).toHaveProperty("event", testEvent!._id);
    expect(result).toHaveProperty("title", args.data.title);
    expect(result).toHaveProperty("description", args.data.description);
    expect(result).toHaveProperty("event", testEvent!._id);
    expect(result).toHaveProperty("creator", context.userId);
  });
});
