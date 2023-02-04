import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Event,
  Interface_Event,
  Interface_EventProject,
  EventProject,
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
  USER_NOT_AUTHORIZED,
  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../../src/constants";
import { updateEventProject } from "../../../src/resolvers/Mutation/updateEventProject";
let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testAdminUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
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
    title: "Event title",
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

  testEventProject = await EventProject.create({
    title: "Event Project title",
    description: "Event Project Description",
    event: testEvent._id,
    creator: testAdminUser._id,
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
        userId: testUser.id,
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
        userId: testUser.id,
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
        userId: testUser._id,
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
        userId: testUser._id,
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
      userId: testAdminUser._id,
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
