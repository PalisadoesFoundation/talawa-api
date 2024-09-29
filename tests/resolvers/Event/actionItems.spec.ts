import "dotenv/config";
import { actionItems as actionItemsResolver } from "../../../src/resolvers/Event/actionItems";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { ActionItem } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import { createTestActionItems } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent] = await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> actionItems", () => {
  it(`returns all actionItems for parent Event`, async () => {
    const parent = testEvent?.toObject();
    if (parent) {
      const actionItemsPayload = await actionItemsResolver?.(parent, {}, {});

      const actionItems = await ActionItem.find({
        eventId: testEvent?._id,
      }).lean();

      expect(actionItemsPayload).toEqual(actionItems);
    }
  });
});
