import "dotenv/config";
import { assigner as assignerResolver } from "../../../src/resolvers/ActionItem/assigner";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testActionItem: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , testActionItem] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> assigner", () => {
  it(`returns the assigner for parent action item`, async () => {
    const parent = testActionItem?.toObject();

    const assignedByPayload = await assignerResolver?.(parent, {}, {});

    const assignedByObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(assignedByPayload).toEqual(assignedByObject);
  });
});
