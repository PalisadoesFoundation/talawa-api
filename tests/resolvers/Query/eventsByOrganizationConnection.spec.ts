// @ts-nocheck
import "dotenv/config";
import { eventsByOrganizationConnection as eventsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/eventsByOrganizationConnection";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { QueryEventsByOrganizationConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { Event } from "../../../src/models";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createEventWithRegistrant } from "../../helpers/events";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestTask } from "../../helpers/task";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvents: TestEventType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
  const testEvent3 = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    false,
    "DAILY"
  );
  testEvents = [testEvent1, testEvent2, testEvent3];
  createTestTask(testEvent1?._id, testUser?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> organizationsMemberConnection", () => {
  it(`Just retrieve events with status = ACTIVE when no specific input argument is passed`, async () => {
    const args: QueryEventsByOrganizationConnectionArgs = {
      first: 1,
      skip: 1,
      where: null,
      orderBy: null,
    };
    const events = await Event.find({
      status: "ACTIVE",
    })
      .limit(1)
      .skip(1)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { id: testEvent[1]._id, title: testEvents[1].title, description:testEvents[1].description, organization: testEvents[1].organization._id, location: testEvents[1].location}
  and sorted by ascending order of event._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };
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

    const events = await Event.find(where).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { id_not: testEvent[0]._id, title_not: testEvents[0].title, description_not:testEvents[0].description, location_not:testEvents[0].location }
  and sorted by descending order of event._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };
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

    const events = await Event.find(where).limit(2).skip(1).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { id_not_in: testEvent[0]._id, title_not_in: testEvents[0].title, description_not_in:testEvents[0].description, location_not_in:testEvents[0].location}
  and sorted by descending order of event.title if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };
    const where = {
      _id: {
        $nin: [testEvents[0]?._id],
      },
      title: {
        $nin: [testEvents[0]?.title],
      },
      description: {
        $nin: [testEvents[0]?.description],
      },
      location: {
        $nin: [testEvents[0]?.location],
      },
    };

    const args: QueryEventsByOrganizationConnectionArgs = {
      where: {
        id_not_in: [testEvents[0]?._id],
        title_not_in: [testEvents[0]?.title],
        description_not_in: [testEvents[0]?.description],
        location_not_in: [testEvents[0]?.location],
      },
      orderBy: "title_DESC",
    };

    const events = await Event.find(where).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { id_in: testEvent[0]._id, title_in: testEvents[0].title, description_in:testEvents[0].description, location_in: testEvents[0].location}
  and sorted by ascending order of event.title if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };
    const where = {
      _id: {
        $in: [testEvents[0]?._id],
      },
      title: {
        $in: [testEvents[0]?.title],
      },
      description: {
        $in: [testEvents[0]?.description],
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
        title_in: [testEvents[0]?.title],
        description_in: [testEvents[0]?.description],
        location_in: [testEvents[0]?.location],
      },
      orderBy: "title_ASC",
    };

    const events = await Event.find(where).limit(2).skip(1).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { title_contains: testEvents[1].title, description_contains:testEvents[1].description, location: testEvents[1].location}
  and sorted by ascending order of event.description if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };
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

    const events = await Event.find(where).limit(2).skip(1).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
  it(`returns list of all existing events filtered by args.where ===
  { title_starts_with: testEvents[1].title, description_starts_with:testEvents[1].description }
  and sorted by descending order of event.description if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };
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

    const events = await Event.find(where).limit(2).skip(1).sort(sort).lean();

    let eventsByOrganizationConnectionPayload =
      await eventsByOrganizationConnectionResolver?.({}, args, {});

    eventsByOrganizationConnectionPayload =
      eventsByOrganizationConnectionPayload?.map((event) => {
        const adminIds = [];
        for (let i = 0; i < event.admins.length; i++) {
          adminIds.push(event.admins[i]._id);
        }
        const tasksIds = [];
        for (let i = 0; i < event.tasks.length; i++) {
          tasksIds.push(event.tasks[i]._id);
        }
        return {
          ...event,
          creator: event?.creator._id,
          admins: adminIds,
          tasks: tasksIds,
        };
      });
    expect(eventsByOrganizationConnectionPayload).toEqual(events);
  });
});
