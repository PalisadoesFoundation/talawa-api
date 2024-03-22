import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { ActionItem, AppUserProfile, Event } from "../../../src/models";
import type { MutationRemoveEventArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { removeEvent as removeEventResolver } from "../../../src/resolvers/Mutation/removeEvent";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { createTestActionItems } from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type {
  // TestAppUserProfileType,
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
// let testUserAppProfile: TestAppUserProfileType;
let newTestUser: TestUserType;
// let newTestUserAppProfile: TestAppUserProfileType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let newTestEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);

  const temp = await createTestEvent();
  testUser = temp[0];
  testOrganization = temp[1];
  testEvent = temp[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: "",
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an
  admin of organization with _id === event.organization for event with _id === args.id
  or an admin for event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
        },
        {
          $set: {
            adminFor: [],
          },
        },
      );

      await Event.updateOne(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
      );

      const args: MutationRemoveEventArgs = {
        id: testEvent?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`removes event with _id === args.id and returns it`, async () => {
    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
      },
      {
        $push: {
          adminFor: testOrganization?._id,
        },
      },
    );

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
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

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }

    const args: MutationRemoveEventArgs = {
      id: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual({
      ...testEvent?.toObject(),
      updatedAt: expect.anything(),
    });

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })

      .select(["createdEvents", "eventAdmin"])
      .lean();

    expect(updatedTestUserAppProfile?.createdEvents).toEqual([]);
    expect(updatedTestUserAppProfile?.eventAdmin).toEqual([]);

    const testEventExists = await Event.exists({
      _id: testEvent?._id,
    });

    expect(testEventExists).toBeFalsy();
  });

  it(`removes the events and all action items assiciated with it`, async () => {
    [newTestUser, newTestEvent] = await createTestActionItems();

    const args: MutationRemoveEventArgs = {
      id: newTestEvent?.id,
    };

    const context = {
      userId: newTestUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(newTestEvent?.toObject());

    const deletedActionItems = await ActionItem.find({
      eventId: newTestEvent?._id,
    });

    expect(deletedActionItems).toEqual([]);
  });
  it("throws an error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationRemoveEventArgs = {
      id: testEvent?.id,
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );
      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
