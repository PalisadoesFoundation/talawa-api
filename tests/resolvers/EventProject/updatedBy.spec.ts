import "dotenv/config";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/EventProject/updatedBy";
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
  it(`returns the updator user object for parent event project`, async () => {
    const parent = testEventProject!.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
