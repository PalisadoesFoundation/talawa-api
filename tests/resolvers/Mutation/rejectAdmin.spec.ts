import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationRejectAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { rejectAdmin as rejectAdminResolver } from "../../../src/resolvers/Mutation/rejectAdmin";
import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser1: testUserType;
let testUser2: testUserType;

beforeAll(async () => {
  await connect();
  testUser1 = await createTestUserFunc();
  testUser2 = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> rejectAdmin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws Error if userType of user with _id === context.userId is not SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: testUser1!.id,
      };
      await User.findByIdAndUpdate(
        {
          _id: testUser1?._id,
        },
        {
          userType: "USER",
        }
      );
      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.message}`
      );

      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.message);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { rejectAdmin: rejectAdminResolver } = await import(
        "../../../src/resolvers/Mutation/rejectAdmin"
      );

      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await User.updateOne(
        {
          _id: testUser1!._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationRejectAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser1!.id,
      };

      const { rejectAdmin: rejectAdminResolver } = await import(
        "../../../src/resolvers/Mutation/rejectAdmin"
      );
      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it("should  not delete the user with _id === args.id but set its adminApproved property to false", async () => {
    const args: MutationRejectAdminArgs = {
      id: testUser2!.id,
    };

    const context = {
      userId: testUser1!.id,
    };

    const { rejectAdmin: rejectAdminResolver } = await import(
      "../../../src/resolvers/Mutation/rejectAdmin"
    );

    const flag = await rejectAdminResolver?.({}, args, context);

    expect(flag).toBe(true);
  });
});
