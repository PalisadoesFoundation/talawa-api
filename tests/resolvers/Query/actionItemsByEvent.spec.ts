import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActionItem } from "../../../src/models";
import { actionItemsByEvent as actionItemsByEventsResolver } from "../../../src/resolvers/Query/actionItemsByEvent";
import type { QueryActionItemsByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestActionItems } from "../../helpers/actionItem";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent] = await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByEvent", () => {
  it(`returns list of all action items associated with an event`, async () => {
    const args: QueryActionItemsByEventArgs = {
      eventId: testEvent?._id.toString() ?? "",
    };

    const actionItemsByEventPayload = await actionItemsByEventsResolver?.(
      {},
      args,
      {},
    );

    const actionItemsByEventInfo = await ActionItem.find({
      event: testEvent?._id,
    }).lean();

    expect(actionItemsByEventPayload).toEqual(actionItemsByEventInfo);
  });
});
