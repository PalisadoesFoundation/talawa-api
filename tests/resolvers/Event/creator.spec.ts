import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Event/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestEventType } from "../../helpers/events";
import { User } from "../../../src/models";
import { type TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> organization", () => {
  it(`returns the creator user object for parent event`, async () => {
    const parent = testEvent?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const creatorIdPayload = await creatorResolver?.(parent, {}, {});

    const creatorIdObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(creatorIdPayload).toEqual(creatorIdObject);
  });
});
