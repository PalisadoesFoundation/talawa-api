import "dotenv/config";
import { assignedTo as assignedToResolver } from "../../../src/resolvers/ActionItem/assignedTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let randomTestUser: TestUserType;
let testActionItem: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , , testActionItem, randomTestUser] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> assignedBy", () => {
  it(`returns the assignee for parent action item`, async () => {
    const parent = testActionItem?.toObject();

    const assignedToPayload = await assignedToResolver?.(parent, {}, {});

    const assignedToObject = await User.findOne({
      _id: randomTestUser?._id,
    }).lean();

    expect(assignedToPayload).toEqual(assignedToObject);
  });
});
