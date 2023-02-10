import "dotenv/config";
import { events as eventsResolver } from "../../../src/resolvers/Query/events";
import { Event } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { QueryEventsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createEventWithRegistrant } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

beforeAll(async () => {
  await connect();
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testEvent1 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );
  const testEvent2 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    false,
    "DAILY"
  );

  const testEvents = [testEvent1, testEvent2];
  await createTestTask(testEvents[0]?._id, testUser?._id);
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> events", () => {
  it(`returns list of all existing events sorted by ascending order of event._id
  if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "id_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event._id
  if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "id_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.title
  if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "title_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.title
  if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "title_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.description
  if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "description_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.description
  if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "description_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.startDate
  if args.orderBy === 'startDate_ASC'`, async () => {
    const sort = {
      startDate: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "startDate_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.startDate
  if args.orderBy === 'startDate_DESC'`, async () => {
    const sort = {
      startDate: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "startDate_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.endDate
  if args.orderBy === 'endDate_ASC'`, async () => {
    const sort = {
      endDate: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "endDate_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.endDate
  if args.orderBy === 'endDate_DESC'`, async () => {
    const sort = {
      endDate: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "endDate_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.allDay
  if args.orderBy === 'allDay_ASC'`, async () => {
    const sort = {
      allDay: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "allDay_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.allDay
  if args.orderBy === 'allDay_DESC'`, async () => {
    const sort = {
      allDay: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "allDay_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.startTime
  if args.orderBy === 'startTime_ASC'`, async () => {
    const sort = {
      startTime: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "startTime_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.startTime
  if args.orderBy === 'startTime_DESC'`, async () => {
    const sort = {
      startTime: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "startTime_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.endTime
  if args.orderBy === 'endTime_ASC'`, async () => {
    const sort = {
      endTime: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "endTime_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.endTime
  if args.orderBy === 'endTime_DESC'`, async () => {
    const sort = {
      endTime: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "endTime_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.recurrance
  if args.orderBy === 'recurrance_ASC'`, async () => {
    const sort = {
      recurrance: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "recurrance_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.recurrance
  if args.orderBy === 'recurrance_DESC'`, async () => {
    const sort = {
      recurrance: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "recurrance_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by ascending order of event.location
  if args.orderBy === 'location_ASC'`, async () => {
    const sort = {
      location: 1,
    };

    const args: QueryEventsArgs = {
      orderBy: "location_ASC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });

  it(`returns list of all existing events sorted by descending order of event.location
  if args.orderBy === 'location_DESC'`, async () => {
    const sort = {
      location: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: "location_DESC",
    };

    const eventsPayload = await eventsResolver?.({}, args, {});

    const events = await Event.find({
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsPayload).toEqual(events);
  });
});
