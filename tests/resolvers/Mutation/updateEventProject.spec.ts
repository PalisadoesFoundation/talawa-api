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
  beforeEach,
} from "vitest";
import {
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  IN_PRODUCTION,
  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_CODE,
} from "../../../src/constants";
import { updateEventProject } from "../../../src/resolvers/Mutation/updateEventProject";
let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testAdminUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;
let testEventProject: Interface_EventProject &
  Document<any, any, Interface_EventProject>;

beforeEach(() => {
  vi.stubGlobal(IN_PRODUCTION, true);
});

beforeAll(async () => {
  vi.stubGlobal(IN_PRODUCTION, true);
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
  it("Should throw an error if the user is not found", async () => {
    try {
      const args = {
        data: {
          eventId: null,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_FOUND);
    }
  });

  it("should throw an error when event is not found", async () => {
    try {
      const args = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      if (IN_PRODUCTION) {
        expect(error.message).toBe(EVENT_PROJECT_NOT_FOUND_MESSAGE);
        expect(error.code).toBe(EVENT_PROJECT_NOT_FOUND_CODE);
      }
    }
  });

  it("should throw an error when event is not found", async () => {
    try {
      vi.stubGlobal(IN_PRODUCTION, false);
      const args = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await updateEventProject?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toBe(EVENT_PROJECT_NOT_FOUND);
    }
  });

  it("should throw an error if user is not admin of the event", async () => {
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
