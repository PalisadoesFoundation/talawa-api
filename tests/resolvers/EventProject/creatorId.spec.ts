import "dotenv/config";
import { creatorId as creatorIdResolver } from "../../../src/resolvers/EventProject/creatorId";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import { type TestUserType } from "../../helpers/userAndOrg";
import type { TestEventProjectType } from "../../helpers/task";
import { createAndAssignTestTask } from "../../helpers/task";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEventProject: TestEventProjectType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , testEventProject] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> organization", () => {
  it(`returns the creator user object for parent event project`, async () => {
    const parent = testEventProject!.toObject();

    const creatorIdPayload = await creatorIdResolver?.(parent, {}, {});

    const creatorIdObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(creatorIdPayload).toEqual(creatorIdObject);
  });
});
