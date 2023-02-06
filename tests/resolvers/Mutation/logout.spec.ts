import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { logout as logoutResolver } from "../../../src/resolvers/Mutation/logout";
import { USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> logout", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await logoutResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`sets token === null for user with _id === context.userId and returns true`, async () => {
    const context = {
      userId: testUser!.id,
    };

    const logoutPayload = await logoutResolver?.({}, {}, context);

    expect(logoutPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["token"])
      .lean();

    expect(updatedTestUser!.token).toEqual(null);
  });
});
