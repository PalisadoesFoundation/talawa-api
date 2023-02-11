import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  ORGANIZATION_NOT_AUTHORIZED_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUser,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

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
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> createEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateEventArgs = {};

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
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
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
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

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_AUTHORIZED_MESSAGE);
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
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

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
  it("should send a message when user and user.token exists", async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $set: {
          token: "random",
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

    const admin = await import("firebase-admin");

    const spy = vi
      .spyOn(admin.messaging(), "send")
      .mockImplementationOnce(async () => `Message sent`);

    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    await createEventResolver?.({}, args, context);
    expect(spy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("should send a message when user and user.token exists", async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $set: {
          token: "random",
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

    const admin = await import("firebase-admin");

    const spy = vi
      .spyOn(admin.messaging(), "send")
      .mockImplementationOnce(async () => `Message sent`);

    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    await createEventResolver?.({}, args, context);
    expect(spy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
    vi.resetModules();
  });
});
