import "dotenv/config";
import { eventsByOrganization as eventsByOrganizationResolver } from "../../../src/resolvers/Query/eventsByOrganization";
import { Event } from "../../../src/models";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import { QueryEventsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
  testOrganizationType,
} from "../../helpers/userAndOrg";
import { createEventWithRegistrant } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";
import mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  [testUser, testOrganization] = await createTestUserAndOrganization();
  const testEvent1 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );
  const testEvent2 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );

  const testEvents = [testEvent1, testEvent2];
  await createTestTask(testEvents[0]?._id, testUser?._id);
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> eventsByOrganization", () => {
  it(`returns list of all existing events sorted by ascending order of event._id
  if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "id_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event._id
  if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "id_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.title
  if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "title_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.title
  if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "title_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.description
  if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "description_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.description
  if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "description_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.startDate
  if args.orderBy === 'startDate_ASC'`, async () => {
    const sort = {
      startDate: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "startDate_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.startDate
  if args.orderBy === 'startDate_DESC'`, async () => {
    const sort = {
      startDate: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "startDate_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.endDate
  if args.orderBy === 'endDate_ASC'`, async () => {
    const sort = {
      endDate: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "endDate_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.endDate
  if args.orderBy === 'endDate_DESC'`, async () => {
    const sort = {
      endDate: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "endDate_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.allDay
  if args.orderBy === 'allDay_ASC'`, async () => {
    const sort = {
      allDay: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "allDay_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.allDay
  if args.orderBy === 'allDay_DESC'`, async () => {
    const sort = {
      allDay: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "allDay_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.startTime
  if args.orderBy === 'startTime_ASC'`, async () => {
    const sort = {
      startTime: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "startTime_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.startTime
  if args.orderBy === 'startTime_DESC'`, async () => {
    const sort = {
      startTime: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "startTime_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.endTime
  if args.orderBy === 'endTime_ASC'`, async () => {
    const sort = {
      endTime: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "endTime_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.endTime
  if args.orderBy === 'endTime_DESC'`, async () => {
    const sort = {
      endTime: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "endTime_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.recurrance
  if args.orderBy === 'recurrance_ASC'`, async () => {
    const sort = {
      recurrance: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "recurrance_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.recurrance
  if args.orderBy === 'recurrance_DESC'`, async () => {
    const sort = {
      recurrance: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "recurrance_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by ascending order of event.location
  if args.orderBy === 'location_ASC'`, async () => {
    const sort = {
      location: 1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "location_ASC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events sorted by descending order of event.location
  if args.orderBy === 'location_DESC'`, async () => {
    const sort = {
      location: -1,
    };

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: "location_DESC",
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });

  it(`returns list of all existing events without sorting if args.orderBy === null`, async () => {
    const sort = {};

    const args: QueryEventsByOrganizationArgs = {
      id: testOrganization?._id,
      orderBy: null,
    };

    const eventsByOrganizationPayload = await eventsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const eventsByOrganization = await Event.find({
      organization: testOrganization?._id,
      status: "ACTIVE",
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventsByOrganizationPayload).toEqual(eventsByOrganization);
  });
});
