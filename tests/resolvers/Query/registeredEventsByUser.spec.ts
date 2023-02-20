import "dotenv/config";
import { registeredEventsByUser as registeredEventsByUserResolver } from "../../../src/resolvers/Query/registeredEventsByUser";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { Event } from "../../../src/models";
import { QueryRegisteredEventsByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  testUser = (await createTestUserAndOrganization())[0];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> events", () => {
  it(`returns list of all existing events sorted by ascending order of event._id
  if args.orderBy === 'id_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "id_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event._id
  if args.orderBy === 'id_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "id_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.title
  if args.orderBy === 'title_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "title_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.title
  if args.orderBy === 'title_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "title_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.description
  if args.orderBy === 'description_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "description_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.description
  if args.orderBy === 'description_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "description_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.startDate
  if args.orderBy === 'startDate_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      startDate: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "startDate_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.startDate
  if args.orderBy === 'startDate_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      startDate: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "startDate_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.endDate
  if args.orderBy === 'endDate_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      endDate: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "endDate_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.endDate
  if args.orderBy === 'endDate_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      endDate: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "endDate_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.allDay
  if args.orderBy === 'allDay_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      allDay: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "allDay_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.allDay
  if args.orderBy === 'allDay_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      allDay: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "allDay_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.startTime
  if args.orderBy === 'startTime_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      startTime: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "startTime_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.startTime
  if args.orderBy === 'startTime_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      startTime: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "startTime_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.endTime
  if args.orderBy === 'endTime_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      endTime: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "endTime_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.endTime
  if args.orderBy === 'endTime_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      endTime: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "endTime_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.recurrance
  if args.orderBy === 'recurrance_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      recurrance: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "recurrance_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.recurrance
  if args.orderBy === 'recurrance_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      recurrance: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "recurrance_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by ascending order of event.location
  if args.orderBy === 'location_ASC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      location: 1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "location_ASC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events sorted by descending order of event.location
  if args.orderBy === 'location_DESC where user with _id === args.id is a registrant'`, async () => {
    const sort = {
      location: -1,
    };

    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: "location_DESC",
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });

  it(`returns list of all existing events without sorting if args.orderBy === null`, async () => {
    const sort = {};
    const args: QueryRegisteredEventsByUserArgs = {
      id: testUser?._id,
      orderBy: null,
    };

    const registeredEventsByUser = await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: testUser?._id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const registeredEventsByUserPayload =
      await registeredEventsByUserResolver?.({}, args, {});

    expect(registeredEventsByUserPayload).toEqual(registeredEventsByUser);
  });
});
