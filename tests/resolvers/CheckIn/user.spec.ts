import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/CheckIn/user";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import {
  createEventWithCheckedInUser,
  type TestCheckInType,
} from "../../helpers/checkIn";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCheckIn: TestCheckInType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , testCheckIn] = await createEventWithCheckedInUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> CheckIn -> user", () => {
  it(`returns the user object for parent post`, async () => {
    const parent = testCheckIn!.toObject();

    const userPayload = await userResolver?.(parent, {}, {});

    const userObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(userPayload).toEqual(userObject);
  });
});
