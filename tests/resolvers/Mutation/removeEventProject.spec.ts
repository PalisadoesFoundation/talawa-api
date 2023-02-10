import "dotenv/config";
import { Document } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Event,
  Interface_Event,
  EventProject,
  Interface_EventProject,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../../src/db";
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
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
} from "../../../src/constants";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testUserNotCreatorOfEventProject: Interface_User &
  Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testUserNotCreatorOfEventProject = await User.create({
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
    admins: [testUser._id],
    members: [testUser._id],
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
    admins: [testUser._id],
    registrants: [],
    organization: testOrganization._id,
  });

  testEventProject = await EventProject.create({
    title: "title",
    description: "description",
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
    event: testEvent._id,
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
  await EventProject.deleteMany({});
  await disconnect();
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

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(USER_NOT_FOUND);
  });
  it("Should throw an error if the user is not found and IN_PRODUCTION is true", async () => {
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
        IN_PRODUCTION: true,
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
      userId: testUser._id,
    };

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(EVENT_PROJECT_NOT_FOUND);
  });
  it("Should throw an error if the eventProject is not found and IN_PRODUCTION is true", async () => {
    const args = {
      id: null,
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
      userId: testUserNotCreatorOfEventProject._id,
    };

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(USER_NOT_AUTHORIZED);
  });
  it("Should throw an error if the user is not the creator of the eventProject and IN_PRODUCTION is true", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUserNotCreatorOfEventProject._id,
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
      userId: testUser._id,
    };

    const { removeEventProject } = await import(
      "../../../src/resolvers/Mutation/removeEventProject"
    );

    await removeEventProject(null, args, context);

    const eventProject = await EventProject.findOne(testEventProject._id);

    expect(eventProject).toBeNull();
  });
});
