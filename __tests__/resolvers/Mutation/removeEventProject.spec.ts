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
} from "../../../src/lib/models";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../../src/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { removeEventProject } from "../../../src/lib/resolvers/Mutation/removeEventProject";
import {
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  EVENT_PROJECT_NOT_FOUND,
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

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(USER_NOT_FOUND);
  });
  it("Should throw an error if the eventProject is not found", async () => {
    const args = {
      id: null,
    };

    const context = {
      userId: testUser._id,
    };

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(EVENT_PROJECT_NOT_FOUND);
  });
  it("Should throw an error if the user is not the creator of the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUserNotCreatorOfEventProject._id,
    };

    expect(async () => {
      await removeEventProject(null, args, context);
    }).rejects.toThrowError(USER_NOT_AUTHORIZED);
  });
  it("Should remove the eventProject", async () => {
    const args = {
      id: testEventProject._id,
    };

    const context = {
      userId: testUser._id,
    };

    await removeEventProject(null, args, context);

    const eventProject = await EventProject.findOne(testEventProject._id);

    expect(eventProject).toBeNull();
  });
});
