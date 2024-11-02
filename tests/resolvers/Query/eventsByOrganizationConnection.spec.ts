import "dotenv/config";
import { eventsByOrganizationConnection as eventsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/eventsByOrganizationConnection";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import type mongoose from "mongoose";
import type {
  MutationCreateEventArgs,
  QueryEventsByOrganizationConnectionArgs,
} from "../../../src/types/generatedGraphQLTypes";
import type { InterfaceEvent } from "../../../src/models";
import { Event, Frequency, RecurrenceRule } from "../../../src/models";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createEventWithRegistrant } from "../../helpers/events";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { addDays, addYears } from "date-fns";
import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import type { TestUserType } from "../../helpers/user";
import type { InterfaceRecurrenceRule } from "../../../src/models/";

import {
  RECURRING_EVENT_INSTANCES_DAILY_LIMIT,
  RECURRING_EVENT_INSTANCES_QUERY_LIMIT,
  RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT,
} from "../../../src/constants";
import { rrulestr } from "rrule";
import type { RRule } from "rrule";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvents: TestEventType[];
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  [testUser, testOrganization] = await createTestUserAndOrganization();
  const testEvent1 = await createEventWithRegistrant(
    testUser?._id.toString() ?? "defaultUserId",
    testOrganization?._id,
    true,
  );
  const testEvent2 = await createEventWithRegistrant(
    testUser?._id.toString() ?? "defaultUserId",
    testOrganization?._id,
    false,
  );
  const testEvent3 = await createEventWithRegistrant(
    testUser?._id.toString() ?? "defaultUserId",
    testOrganization?._id,
    false,
  );
  const testEvent4 = await createEventWithRegistrant(
    testUser?._id.toString() ?? "defaultUserId",
    testOrganization?._id,
    false,
  );
  const testEvent5 = await createEventWithRegistrant(
    testUser?._id.toString() ?? "defaultUserId",
    testOrganization?._id,
    false,
  );

  if (testEvent4) {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    testEvent4.startDate = nextWeek.toISOString().split("T")[0];
    testEvent4.endDate = nextWeek.toISOString().split("T")[0];
    await testEvent4.save();
  }

  if (testEvent5) {
    // set endDate to today and set endTime to 1 min from now
    const today = new Date();
    testEvent5.endDate = today.toISOString().split("T")[0];
    testEvent5.endTime = new Date(
      today.setMinutes(today.getMinutes() + 1),
    ).toISOString();
    await testEvent5.save();
  }

  testEvents = [testEvent1, testEvent2, testEvent3, testEvent4, testEvent5];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> organizationsMemberConnection", () => {
  it(`returns list of all existing events filtered by args.where ===
  { id: testEvent[1]._id, title: testEvents[1].title, description:testEvents[1].description, organization: testEvents[1].organization._id, location: testEvents[1].location}
  and sorted by ascending order of event._id if args.orderBy === 'id_ASC'`, async () => {
    const where = {
      _id: testEvents[1]?._id,
      title: testEvents[1]?.title,
      description: testEvents[1]?.description,
      organization: testEvents[1]?.organization._id,
      location: testEvents[1]?.location,
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 1,
      skip: 0,
      where: {
        id: testEvents[1]?._id,
        title: testEvents[1]?.title,
        description: testEvents[1]?.description,
        organization_id: testEvents[1]?.organization._id,
        location: testEvents[1]?.location,
      },
      orderBy: "id_ASC",
    };

    const events = await Event.find(where)
      .sort({
        _id: 1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId._id,
          admins: adminIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });

  it(`returns list of all existing events filtered by args.where ===
  { id_not: testEvent[0]._id, title_not: testEvents[0].title, description_not:testEvents[0].description, location_not:testEvents[0].location }
  and sorted by descending order of event._id if args.orderBy === 'id_DESC'`, async () => {
    const where = {
      _id: {
        $ne: testEvents[0]?._id,
      },
      title: {
        $ne: testEvents[0]?.title,
      },
      description: {
        $ne: testEvents[0]?.description,
      },
      location: {
        $ne: testEvents[0]?.location,
      },
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_not: testEvents[0]?._id,
        title_not: testEvents[0]?.title,
        description_not: testEvents[0]?.description,
        location_not: testEvents[0]?.location,
      },
      orderBy: "id_DESC",
    };

    const events = await Event.find(where)
      .limit(2)
      .skip(1)
      .sort({
        _id: -1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId._id,
          admins: adminIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { id_not_in: testEvent[0]._id, title_not_in: testEvents[0].title, description_not_in:testEvents[0].description, location_not_in:testEvents[0].location}
  and sorted by descending order of event.title if args.orderBy === 'title_DESC'`, async () => {
    const where = {
      _id: {
        $nin: [testEvents[0]?._id],
      },
      title: {
        $nin: [testEvents[0]?.title ?? ""],
      },
      description: {
        $nin: [testEvents[0]?.description ?? ""],
      },
      location: {
        $nin: [testEvents[0]?.location],
      },
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      where: {
        id_not_in: [testEvents[0]?._id],
        title_not_in: [testEvents[0]?.title ?? ""],
        description_not_in: [testEvents[0]?.description ?? ""],
        location_not_in: [testEvents[0]?.location ?? ""],
      },
      orderBy: "title_DESC",
    };

    const events = await Event.find(where)
      .sort({
        title: -1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId?._id,
          admins: adminIds,
        };
      });

    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });

  it(`returns list of all existing events filtered by args.where ===
  { id_in: testEvent[0]._id, title_in: testEvents[0].title, description_in:testEvents[0].description, location_in: testEvents[0].location}
  and sorted by ascending order of event.title if args.orderBy === 'title_ASC'`, async () => {
    const where = {
      _id: {
        $in: [testEvents[0]?._id],
      },
      title: {
        $in: [testEvents[0]?.title ?? ""],
      },
      description: {
        $in: [testEvents[0]?.description ?? ""],
      },
      location: {
        $in: [testEvents[0]?.location],
      },
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_in: [testEvents[0]?._id],
        title_in: [testEvents[0]?.title ?? ""],
        description_in: [testEvents[0]?.description ?? ""],
        location_in: [testEvents[0]?.location ?? ""],
      },
      orderBy: "title_ASC",
    };

    const events = await Event.find(where)
      .limit(2)
      .skip(1)
      .sort({
        title: 1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId._id,
          admins: adminIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { title_contains: testEvents[1].title, description_contains:testEvents[1].description, location: testEvents[1].location}
  and sorted by ascending order of event.description if args.orderBy === 'description_ASC'`, async () => {
    const where = {
      title: {
        $regex: testEvents[1]?.title,
        $options: "i",
      },
      description: {
        $regex: testEvents[1]?.description,
        $options: "i",
      },
      location: {
        $regex: testEvents[1]?.location,
        $options: "i",
      },
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        title_contains: testEvents[1]?.title,
        description_contains: testEvents[1]?.description,
        location_contains: testEvents[1]?.location,
      },
      orderBy: "title_ASC",
    };

    const events = await Event.find(where)
      .limit(2)
      .skip(1)
      .sort({
        description: 1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId._id,
          admins: adminIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { title_starts_with: testEvents[1].title, description_starts_with:testEvents[1].description }
  and sorted by descending order of event.description if args.orderBy === 'description_DESC'`, async () => {
    const where = {
      title: new RegExp("^" + testEvents[1]?.title),
      description: new RegExp("^" + testEvents[1]?.description),
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        title_starts_with: testEvents[1]?.title,
        description_starts_with: testEvents[1]?.description,
      },
      orderBy: "title_DESC",
    };

    const events = await Event.find(where)
      .limit(2)
      .skip(1)
      .sort({
        description: -1,
      })
      .lean();

    let eventsByOrganizationConnectionPayload =
      (await eventsByOrganizationConnectionResolver?.(
        {},
        args,
        {},
      )) as InterfaceEvent[];

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        return {
          ...event,
          creatorId: event?.creatorId._id,
          admins: adminIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });

  it("dynamically generates recurring event instances during query for events with no end dates", async () => {
    vi.useFakeTimers();

    const startDate = convertToUTCDate(new Date());
    const endDate = startDate;

    const eventArgs: MutationCreateEventArgs = {
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
        frequency: "DAILY",
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.(
      {},
      eventArgs,
      context,
    );

    expect(createEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        title: "newTitle",
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    let recurrenceRule = await RecurrenceRule.findOne({
      frequency: Frequency.DAILY,
      recurrenceStartDate: startDate,
    });

    const { recurrenceRuleString } = recurrenceRule as InterfaceRecurrenceRule;
    const recurrenceRuleObject: RRule = rrulestr(recurrenceRuleString);

    const generateUptoDate = addYears(
      startDate,
      RECURRING_EVENT_INSTANCES_DAILY_LIMIT,
    );

    const currentLatestInstanceDate = recurrenceRuleObject.before(
      generateUptoDate,
      true,
    );

    expect(recurrenceRule?.latestInstanceDate).toEqual(
      currentLatestInstanceDate,
    );

    const newMockDate = addDays(currentLatestInstanceDate as Date, 1);
    vi.setSystemTime(newMockDate);

    const args: QueryEventsByOrganizationConnectionArgs = {
      where: {
        organization_id: testOrganization?._id,
      },
    };

    await eventsByOrganizationConnectionResolver?.({}, args, {});

    recurrenceRule = await RecurrenceRule.findOne({
      frequency: Frequency.DAILY,
      recurrenceStartDate: startDate,
    });

    const queryUptoDate = addYears(
      convertToUTCDate(newMockDate),
      RECURRING_EVENT_INSTANCES_QUERY_LIMIT,
    );
    const newGenerateUptoDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_DAILY_LIMIT,
    );

    const newLatestInstanceDate = recurrenceRuleObject.before(
      newGenerateUptoDate,
      true,
    );

    expect(recurrenceRule?.latestInstanceDate).toEqual(newLatestInstanceDate);

    vi.useRealTimers();
  });

  it("dynamically generates recurring event instances during query for a specified number of instances", async () => {
    vi.useFakeTimers();

    const startDate = convertToUTCDate(new Date());
    const endDate = startDate;

    const eventArgs: MutationCreateEventArgs = {
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
        count: 150,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.(
      {},
      eventArgs,
      context,
    );

    expect(createEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        title: "newTitle",
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    let recurrenceRule = await RecurrenceRule.findOne({
      frequency: Frequency.WEEKLY,
      recurrenceStartDate: startDate,
    });

    const { recurrenceRuleString } = recurrenceRule as InterfaceRecurrenceRule;
    const recurrenceRuleObject: RRule = rrulestr(recurrenceRuleString);

    const recurrenceStartDate = startDate;
    const generateUptoDate = addYears(
      recurrenceStartDate,
      RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT,
    );
    const currentLatestInstanceDate = recurrenceRuleObject.before(
      generateUptoDate,
      true,
    );

    expect(recurrenceRule?.latestInstanceDate).toEqual(
      currentLatestInstanceDate,
    );

    const generatedWeeklyRecurringInstances = await Event.find({
      recurrenceRuleId: recurrenceRule?._id,
    });

    expect(generatedWeeklyRecurringInstances.length).toBeLessThan(150);

    const newMockDate = addDays(currentLatestInstanceDate as Date, 1);
    vi.setSystemTime(newMockDate);

    const args: QueryEventsByOrganizationConnectionArgs = {
      where: {
        organization_id: testOrganization?._id,
      },
    };

    await eventsByOrganizationConnectionResolver?.({}, args, {});

    recurrenceRule = await RecurrenceRule.findOne({
      frequency: Frequency.WEEKLY,
      recurrenceStartDate: startDate,
    });

    const queryUptoDate = addYears(
      convertToUTCDate(newMockDate),
      RECURRING_EVENT_INSTANCES_QUERY_LIMIT,
    );
    const newGenerateUptoDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT,
    );

    const newLatestInstanceDate = recurrenceRuleObject.before(
      newGenerateUptoDate,
      true,
    );

    expect(recurrenceRule?.latestInstanceDate).toEqual(newLatestInstanceDate);

    const allWeeklyRecurringEventInstances = await Event.find({
      recurrenceRuleId: recurrenceRule?._id,
    });

    expect(allWeeklyRecurringEventInstances.length).toEqual(150);

    vi.useRealTimers();
  });

  it("fetch upcoming events for the current date", async () => {
    const upcomingEvents = (await eventsByOrganizationConnectionResolver?.(
      {},
      {
        upcomingOnly: true,
        where: {
          organization_id: testOrganization?._id,
        },
      },
      {},
    )) as unknown as InterfaceEvent[];
    expect(upcomingEvents[0]?._id).toEqual(testEvents[3]?._id);
    expect(upcomingEvents[1]?._id).toEqual(testEvents[4]?._id);
  });
});
