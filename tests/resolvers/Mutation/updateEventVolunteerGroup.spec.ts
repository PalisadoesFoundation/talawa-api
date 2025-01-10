import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerGroupArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventVolunteerGroupType } from "./createEventVolunteer.spec";
import { EventVolunteerGroup } from "../../../src/models";
import { requestContext } from "../../../src/libraries";
import { updateEventVolunteerGroup } from "../../../src/resolvers/Mutation/updateEventVolunteerGroup";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let eventAdminUser: TestUserType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [eventAdminUser, , testEvent] = await createTestEvent();
  testGroup = await EventVolunteerGroup.create({
    creator: eventAdminUser?._id,
    event: testEvent?._id,
    leader: eventAdminUser?._id,
    name: "Test group",
    volunteersRequired: 2,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateEventVolunteerGroup", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: testGroup?._id,
        data: {
          name: "updated name",
          eventId: testEvent?._id,
        },
      };

      const context = { userId: new Types.ObjectId().toString() };
      await updateEventVolunteerGroup?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no event volunteer group exists with _id === args.id`, async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          name: "updated name",
          eventId: testEvent?._id,
        },
      };

      const context = { userId: eventAdminUser?._id };
      await updateEventVolunteerGroup?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.data.eventId`, async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: testGroup?._id,
        data: {
          name: "updated name",
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: eventAdminUser?._id };
      await updateEventVolunteerGroup?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user is not leader of group `, async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: testGroup?._id,
        data: {
          name: "updated name",
          eventId: testEvent?._id,
        },
      };

      const testUser2 = await createTestUser();
      const context = { userId: testUser2?._id };

      await updateEventVolunteerGroup?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`updates the Event Volunteer group with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerGroupArgs = {
      id: testGroup?._id,
      data: {
        eventId: testEvent?._id,
        volunteersRequired: 10,
        name: "updated",
      },
    };

    const context = { userId: eventAdminUser?._id };
    const updatedGroup = await updateEventVolunteerGroup?.({}, args, context);

    expect(updatedGroup).toEqual(
      expect.objectContaining({
        name: "updated",
        event: testEvent?._id,
        volunteersRequired: 10,
      }),
    );
  });

  it(`updates the Event Volunteer group with _id === args.id, even if args.data is empty object`, async () => {
    const testGroup2 = await EventVolunteerGroup.create({
      name: "test",
      event: testEvent?._id,
      creator: eventAdminUser?._id,
      volunteersRequired: 2,
      leader: eventAdminUser?._id,
    });
    const args: MutationUpdateEventVolunteerGroupArgs = {
      id: testGroup2?._id.toString(),
      data: {
        eventId: testEvent?._id,
      },
    };

    const context = { userId: eventAdminUser?._id };
    const updatedGroup = await updateEventVolunteerGroup?.({}, args, context);

    expect(updatedGroup).toEqual(
      expect.objectContaining({
        name: testGroup2?.name,
        volunteersRequired: testGroup2?.volunteersRequired,
        event: testGroup2?.event,
      }),
    );
  });
});
