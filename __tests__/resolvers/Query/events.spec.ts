import "dotenv/config";
import { events as eventsResolver } from "../../../src/lib/resolvers/Query/events";
import { Event, User, Organization, Task } from "../../../src/lib/models";
import { connect, disconnect } from "../../../src/db";
import { nanoid } from "nanoid";
import {
  QueryEventsArgs,
  EventOrderByInput,
} from "../../../src/generated/graphqlCodegen";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  const testEvents = await Event.insertMany([
    {
      creator: testUser._id,
      registrants: [
        {
          userId: testUser._id,
          user: testUser._id,
        },
      ],
      admins: [testUser._id],
      organization: testOrganization._id,
      isRegisterable: true,
      isPublic: true,
      title: `title${nanoid()}`,
      description: `description${nanoid()}`,
      allDay: true,
      startDate: new Date().toString(),
      endDate: new Date().toString(),
      startTime: new Date().toString(),
      endTime: new Date().toString(),
      recurrance: "ONCE",
      location: `location${nanoid()}`,
    },
    {
      creator: testUser._id,
      registrants: [
        {
          userId: testUser._id,
          user: testUser._id,
        },
      ],
      admins: [testUser._id],
      organization: testOrganization._id,
      isRegisterable: true,
      isPublic: true,
      title: `title${nanoid()}`,
      description: `description${nanoid()}`,
      allDay: false,
      startDate: new Date().toString(),
      endDate: new Date().toString(),
      startTime: new Date().toString(),
      endTime: new Date().toString(),
      recurrance: "DAILY",
      location: `location${nanoid()}`,
    },
  ]);

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
        createdEvents: [testEvents[0]._id, testEvents[1]._id],
        registeredEvents: [testEvents[0]._id, testEvents[1]._id],
        eventAdmin: [testEvents[0]._id, testEvents[1]._id],
      },
    }
  );

  const testTask = await Task.create({
    title: "title",
    event: testEvents[0]._id,
    creator: testUser._id,
  });

  await Event.updateOne(
    {
      _id: testEvents[0]._id,
    },
    {
      $set: {
        tasks: [testTask._id],
      },
    }
  );
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
      orderBy: EventOrderByInput.IdAsc,
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
      orderBy: EventOrderByInput.IdDesc,
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
      orderBy: EventOrderByInput.TitleAsc,
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
      orderBy: EventOrderByInput.TitleDesc,
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
      orderBy: EventOrderByInput.DescriptionAsc,
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
      orderBy: EventOrderByInput.DescriptionDesc,
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
      orderBy: EventOrderByInput.StartDateAsc,
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
      orderBy: EventOrderByInput.StartDateDesc,
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
      orderBy: EventOrderByInput.EndDateAsc,
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
      orderBy: EventOrderByInput.EndDateDesc,
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
      orderBy: EventOrderByInput.AllDayAsc,
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
      orderBy: EventOrderByInput.AllDayDesc,
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
      orderBy: EventOrderByInput.StartTimeAsc,
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
      orderBy: EventOrderByInput.StartTimeDesc,
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
      orderBy: EventOrderByInput.EndTimeAsc,
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
      orderBy: EventOrderByInput.EndTimeDesc,
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
      orderBy: EventOrderByInput.RecurranceAsc,
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
      orderBy: EventOrderByInput.RecurranceDesc,
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
      orderBy: EventOrderByInput.LocationAsc,
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
      orderBy: EventOrderByInput.LocationDesc,
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
  if args.orderBy === undefined`, async () => {
    const sort = {
      location: -1,
    };

    const args: QueryEventsArgs = {
      orderBy: undefined,
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

  it(`returns list of all existing events without sorting if args.orderBy === null`, async () => {
    const sort = {};

    const args: QueryEventsArgs = {
      orderBy: null,
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
