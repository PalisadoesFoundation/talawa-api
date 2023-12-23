import "dotenv/config";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/Task/updatedBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";
import type { TestUserType } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Task -> updatedBy", () => {
  it(`returns the updatedBy user object for parent task`, async () => {
    const parent = testTask!.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
