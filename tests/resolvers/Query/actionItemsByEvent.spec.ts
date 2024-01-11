import "dotenv/config";
import { ActionItem } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryActionItemsByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { actionItemsByEvent as actionItemsByEventsResolver } from "../../../src/resolvers/Query/actionItemsByEvent";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type mongoose from "mongoose";
import { createTestActionItems } from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testEvent] = await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByEvent", () => {
  it(`returns list of all action items associated with an event`, async () => {
    const args: QueryActionItemsByEventArgs = {
      eventId: testEvent?._id,
    };

    const actionItemsByEventPayload = await actionItemsByEventsResolver?.(
      {},
      args,
      {}
    );

    const actionItemsByEventInfo = await ActionItem.find({
      eventId: testEvent?._id,
    }).lean();

    expect(actionItemsByEventPayload).toEqual(actionItemsByEventInfo);
  });
});
