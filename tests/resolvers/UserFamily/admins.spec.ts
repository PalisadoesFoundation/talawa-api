import "dotenv/config";
import { admins as usersResolver } from "../../../src/resolvers/UserFamily/admins";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserFamilyType } from "../../helpers/userAndUserFamily";
import { createTestUserAndUserFamily } from "../../helpers/userAndUserFamily";

let testUserFamily: TestUserFamilyType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestUserAndUserFamily();
  testUserFamily = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> UserFamily -> admins", () => {
  it(`returns user objects for parent.admins`, async () => {
    if (testUserFamily) {
      const parent = testUserFamily.toObject();

      const usersPayload = await usersResolver?.(parent, {}, {});

      const users = await User.find({
        _id: {
          $in: testUserFamily?.admins,
        },
      }).lean();

      expect(usersPayload).toEqual(users);
    }
  });
});
