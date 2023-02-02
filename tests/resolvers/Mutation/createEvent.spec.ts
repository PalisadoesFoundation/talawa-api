import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createEvent as createEventResolver } from "../../../src/resolvers/Mutation/createEvent";
import {
  ORGANIZATION_NOT_AUTHORIZED,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUser,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();

  testUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser!._id,
    admins: [testUser!._id],
    members: [testUser!._id],
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
  await disconnect();
});

describe("resolvers -> Mutation -> createEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateEventArgs = {};

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await createEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither the creator
  nor a member of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization!.id,
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await createEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_AUTHORIZED);
    }
  });

  it(`creates the event and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization!._id,
          joinedOrganizations: testOrganization!._id,
        },
      }
    );

    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization!.id,
        allDay: false,
        description: "newDescription",
        endDate: new Date().toUTCString(),
        endTime: new Date().toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        startDate: new Date().toUTCString(),
        startTime: new Date().toUTCString(),
        title: "newTitle",
        recurrance: "DAILY",
      },
    };

    const context = {
      userId: testUser!.id,
    };

    const createEventPayload = await createEventResolver?.({}, args, context);

    expect(createEventPayload).toEqual(
      expect.objectContaining({
        allDay: false,
        description: "newDescription",
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        title: "newTitle",
        recurrance: "DAILY",
        creator: testUser!._id,
        registrants: expect.arrayContaining([
          expect.objectContaining({
            userId: testUser!._id.toString(),
            user: testUser!._id,
          }),
        ]),
        admins: expect.arrayContaining([testUser!._id]),
        organization: testOrganization!._id,
      })
    );

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([createEventPayload!._id]),
        createdEvents: expect.arrayContaining([createEventPayload!._id]),
        registeredEvents: expect.arrayContaining([createEventPayload!._id]),
      })
    );
  });
});
