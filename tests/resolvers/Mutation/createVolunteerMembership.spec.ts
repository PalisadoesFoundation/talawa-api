import "dotenv/config";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateVolunteerMembershipArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";
import type { InterfaceEventVolunteerGroup } from "../../../src/models";
import { createVolunteerMembership } from "../../../src/resolvers/Mutation/createVolunteerMembership";
import type {
  TestVolunteerGroupType,
  TestVolunteerType,
} from "../../helpers/volunteers";
import { createTestVolunteerAndGroup } from "../../helpers/volunteers";

export type TestEventVolunteerGroupType =
  | (InterfaceEventVolunteerGroup & Document)
  | null;

let testUser1: TestUserType;
let testEvent: TestEventType;
let tUser: TestUserType;
let tEvent: TestEventType;
let tVolunteer: TestVolunteerType;
let tVolunteerGroup: TestVolunteerGroupType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  testUser1 = await createTestUser();
  [, , testEvent] = await createTestEvent();

  [tUser, , tEvent, tVolunteer, tVolunteerGroup] =
    await createTestVolunteerAndGroup();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createVolunteerMembership", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateVolunteerMembershipArgs = {
        data: {
          event: tEvent?._id,
          group: tVolunteerGroup?._id,
          status: "invited",
          userId: tUser?._id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await createVolunteerMembership?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no volunteer user exists with _id === args.data.userId`, async () => {
    try {
      const args: MutationCreateVolunteerMembershipArgs = {
        data: {
          event: tEvent?._id,
          group: tVolunteerGroup?._id,
          status: "invited",
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: tUser?._id,
      };

      await createVolunteerMembership?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.data.event`, async () => {
    try {
      const args: MutationCreateVolunteerMembershipArgs = {
        data: {
          event: new Types.ObjectId().toString(),
          group: tVolunteerGroup?._id,
          status: "invited",
          userId: tUser?._id,
        },
      };

      const context = {
        userId: tUser?._id,
      };

      await createVolunteerMembership?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`Create Voluneer Membership when volunteer already exists`, async () => {
    const args: MutationCreateVolunteerMembershipArgs = {
      data: {
        event: tEvent?._id,
        group: tVolunteerGroup?._id,
        status: "invited",
        userId: tUser?._id,
      },
    };

    const context = {
      userId: tUser?._id,
    };

    const mem = await createVolunteerMembership?.({}, args, context);
    expect(mem?.volunteer).toEqual(tVolunteer?._id);
  });

  it(`Create Voluneer Membership when volunteer doesn't exists`, async () => {
    const args: MutationCreateVolunteerMembershipArgs = {
      data: {
        event: testEvent?._id,
        status: "invited",
        userId: testUser1?._id,
      },
    };

    const context = {
      userId: tUser?._id,
    };

    const mem = await createVolunteerMembership?.({}, args, context);
    expect(mem?.event).toEqual(testEvent?._id);
  });
});
