import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
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
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventVolunteerType } from "../../helpers/events";
import { createTestEventAndVolunteer } from "../../helpers/events";
import { User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEventVolunteer: TestEventVolunteerType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventAndVolunteer();
  testUser = temp[0];
  testEventVolunteer = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEventVolunteer", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testEventVolunteer?._id,
      };

      const context = { userId: new Types.ObjectId().toString() };

      const u = await User.findById(context.userId);
      console.log(u);

      const { removeEventVolunteer: removeEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/removeEventVolunteer");

      await removeEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no event volunteer exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = { userId: testUser?._id };

      const { removeEventVolunteer: removeEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/removeEventVolunteer");

      await removeEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`removes event volunteer with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerArgs = {
      id: testEventVolunteer?._id,
    };

    const context = { userId: testUser?._id };
    const { removeEventVolunteer: removeEventVolunteerResolver } = await import(
      "../../../src/resolvers/Mutation/removeEventVolunteer"
    );

    const deletedVolunteer = await removeEventVolunteerResolver?.(
      {},
      args,
      context,
    );

    expect(deletedVolunteer).toEqual(
      expect.objectContaining({
        _id: testEventVolunteer?._id,
        userId: testEventVolunteer?.userId,
        isInvited: testEventVolunteer?.isInvited,
        isAssigned: testEventVolunteer?.isAssigned,
        response: testEventVolunteer?.response,
      }),
    );
  });
});
