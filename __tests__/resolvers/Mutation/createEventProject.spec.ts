import "dotenv/config";
import { Document } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Event,
  Interface_Event,
} from "../../../src/models";
import { nanoid } from "nanoid";
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
  USER_NOT_FOUND,
  EVENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../../src/constants";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testAdminUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testAdminUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testAdminUser._id],
    members: [testUser._id, testAdminUser._id],
  });

  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser._id,
    admins: [testAdminUser._id],
    registrants: [],
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        adminFor: testOrganization._id,
      },
    }
  );
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Event.deleteMany({});
  await disconnect();
});

afterEach(async () => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> createEventProject", () => {
  it("Should throw an error if the user is not found", async () => {
    const args = {
      data: {
        eventId: null,
      },
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    expect(async () => {
      await createEventProject(null, args, { user: null });
    }).rejects.toThrowError(USER_NOT_FOUND);
  });
  it("Should throw an error if the user is not found and IN_PRODUCTION is true", async () => {
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
          IN_PRODUCTION: true,
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
      userId: testUser._id,
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    expect(async () => {
      await createEventProject(null, args, context);
    }).rejects.toThrowError(EVENT_NOT_FOUND);
  });
  it("Should throw an error if the event is not found and IN_PRODUCTION is true", async () => {
    const args = {
      data: {
        eventId: null,
      },
    };

    const context = {
      userId: testUser._id,
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
        IN_PRODUCTION: true,
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
        eventId: testEvent._id,
      },
    };

    const context = {
      userId: testUser._id,
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    expect(async () => {
      await createEventProject(null, args, context);
    }).rejects.toThrowError(USER_NOT_AUTHORIZED);
  });
  it("Should throw an error if the user is not an admin of the event and IN_PRODUCTION is true", async () => {
    const args = {
      data: {
        eventId: testEvent._id,
      },
    };

    const context = {
      userId: testUser._id,
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
        IN_PRODUCTION: true,
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
      userId: testAdminUser._id,
    };

    const args = {
      data: {
        eventId: testEvent._id,
        title: "title",
        description: "description",
        event: testEvent._id,
        creator: context.userId,
      },
    };

    const { createEventProject } = await import(
      "../../../src/resolvers/Mutation/createEventProject"
    );

    const result = await createEventProject(null, args, context);

    expect(result).toHaveProperty("event", testEvent._id);
    expect(result).toHaveProperty("title", args.data.title);
    expect(result).toHaveProperty("description", args.data.description);
    expect(result).toHaveProperty("event", testEvent._id);
    expect(result).toHaveProperty("creator", context.userId);
  });
});
