import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/RecurrenceRule/organization";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../../src/models";
import type { InterfaceRecurrenceRule } from "../../../src/models";

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

describe("resolvers -> RecurrenceRule -> organization", () => {
  it(`returns the organization object for parent recurrence rule`, async () => {
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

    const parent = recurrenceRule as InterfaceRecurrenceRule;
    const organizationPayload = await organizationResolver?.(parent, {}, {});

    expect(testOrganization?.toObject()).toEqual(organizationPayload);
  });
});
