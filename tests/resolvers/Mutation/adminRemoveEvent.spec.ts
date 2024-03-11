import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Event, Organization, User } from "../../../src/models";
import type { MutationAdminRemoveEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { adminRemoveEvent as adminRemoveEventResolver } from "../../../src/resolvers/Mutation/adminRemoveEvent";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestEvent();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testEvent = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> adminRemoveEvent", () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationAdminRemoveEventArgs = {
        eventId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === event.organization
  for event with _id === args.eventId`, async () => {
    try {
      await Event.findOneAndUpdate(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            organization: new Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedEvent !== null) {
        await cacheEvents([updatedEvent]);
      }
      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === event.organization for event with _id === args.eventId`, async () => {
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    try {
      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });

      const context = {
        userId: newUser.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it(`removes event with _id === args.eventId and returns it`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationAdminRemoveEventArgs = {
      eventId: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const adminRemoveEventPayload = await adminRemoveEventResolver?.(
      {},
      args,
      context,
    );

    expect(adminRemoveEventPayload).toEqual({
      ...testEvent?.toObject(),
      updatedAt: expect.anything(),
    });

    const testUpdatedUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const testUpdatedAppUser = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents", "eventAdmin"])
      .lean();
    expect(testUpdatedUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([]),
      }),
    );
    expect(testUpdatedAppUser).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([]),
        eventAdmin: expect.arrayContaining([]),
      }),
    );
  });
});
