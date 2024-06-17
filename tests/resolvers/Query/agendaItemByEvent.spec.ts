import "dotenv/config";
import { AgendaItemModel } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryAgendaItemByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { agendaItemByEvent } from "../../../src/resolvers/Query/agendaItemByEvent";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type mongoose from "mongoose";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> agendaItemByEvent", () => {
  it(`returns list of all items belonging to an event`, async () => {
    const args: QueryAgendaItemByEventArgs = {
      relatedEventId: testEvent?._id,
    };

    const itemByEventPayload = await agendaItemByEvent?.({}, args, {});

    const itemByEventInfo = await AgendaItemModel.find({
      relatedEventId: testEvent?._id,
    }).lean();

    expect(itemByEventPayload).toEqual(itemByEventInfo);
  });
});
