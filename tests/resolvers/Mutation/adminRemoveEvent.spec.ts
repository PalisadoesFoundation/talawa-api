import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, Event, TransactionLog } from "../../../src/models";
import type { MutationAdminRemoveEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { adminRemoveEvent as adminRemoveEventResolver } from "../../../src/resolvers/Mutation/adminRemoveEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { wait } from "./acceptAdmin.spec";

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
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> adminRemoveEvent", () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationAdminRemoveEventArgs = {
        eventId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
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
            organization: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
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
        }
      );

      if (updatedEvent !== null) {
        await cacheEvents([updatedEvent]);
      }
      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
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
        }
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
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
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
      }
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
      context
    );

    expect(adminRemoveEventPayload).toEqual(testEvent?.toObject());

    const testUpdatedUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["createdEvents", "eventAdmin", "registeredEvents"])
      .lean();

    expect(testUpdatedUser).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([]),
        eventAdmin: expect.arrayContaining([]),
        registeredEvents: expect.arrayContaining([]),
      })
    );
    await wait();

    const mostRecentTransactions = await TransactionLog.find().sort({
      createdAt: -1,
    });

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "Event",
    });

    expect(mostRecentTransactions[1]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });
  });
});
