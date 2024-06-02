import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { UserFamily } from "../../../src/models/userFamily";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestUserType,
  TestUserFamilyType,
} from "../../helpers/userAndUserFamily";
import { createTestUserAndUserFamily } from "../../helpers/userAndUserFamily";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUserFamily: TestUserFamilyType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndUserFamily = await createTestUserAndUserFamily();
  testUser = userAndUserFamily[0];
  testUserFamily = userAndUserFamily[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> UserFamily -> creator", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === parent.creator`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      testUserFamily = await UserFamily.findOneAndUpdate(
        {
          _id: testUserFamily?._id,
        },
        {
          $set: {
            creator: new Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
      );

      const parent = testUserFamily?.toObject();

      const { creator: creatorResolver } = await import(
        "../../../src/resolvers/UserFamily/creator"
      );
      if (parent) {
        await creatorResolver?.(parent, {}, {});
      }
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`returns user object for parent.creator`, async () => {
    testUserFamily = await UserFamily.findOneAndUpdate(
      {
        _id: testUserFamily?._id,
      },
      {
        $set: {
          creator: testUser?._id,
        },
      },
      {
        new: true,
      },
    );

    const parent = testUserFamily?.toObject();

    const { creator: creatorResolver } = await import(
      "../../../src/resolvers/UserFamily/creator"
    );
    if (parent) {
      const creatorPayload = await creatorResolver?.(parent, {}, {});
      const creator = await User.findOne({
        _id: testUserFamily?.creator.toString(),
      }).lean();

      expect(creatorPayload).toEqual(creator);
    }
  });
});
