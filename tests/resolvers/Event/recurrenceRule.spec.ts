import "dotenv/config";
import { recurrenceRule as recurrenceRuleResolver } from "../../../src/resolvers/Event/recurrenceRule";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { RecurrenceRule } from "../../../src/models";
import type { InterfaceEvent } from "../../../src/models";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);

  [testUser, testOrganization] = await createTestUserAndOrganization();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> recurrenceRule", () => {
  it(`returns the recurrence rule object for parent event`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);
    const endDate = startDate;

    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
        allDay: true,
        description: "newDescription",
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        startDate,
        endDate,
        title: "newTitle",
      },
      recurrenceRuleData: {
        recurrenceStartDate: startDate,
        frequency: "WEEKLY",
        weekDays: ["MONDAY", "TUESDAY", "WEDNESDAY"],
        count: 10,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    }).lean();

    const parent = createEventPayload as InterfaceEvent;
    const recurrenceRulePayload = await recurrenceRuleResolver?.(
      parent,
      {},
      {},
    );

    expect(recurrenceRule).toEqual(recurrenceRulePayload);
  });
});
