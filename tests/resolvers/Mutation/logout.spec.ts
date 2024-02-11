import "dotenv/config";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";

import { logout as logoutResolver } from "../../../src/resolvers/Mutation/logout";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> logout", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`sets token === null for user with _id === context.userId and returns true`, async () => {
    const context = {
      userId: testUser?.id,
    };

    const logoutPayload = await logoutResolver?.({}, {}, context);

    expect(logoutPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["token"])
      .lean();

    expect(updatedTestUser?.token).toEqual(null);
  });
});
