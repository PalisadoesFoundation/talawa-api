import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event, EventAttendee } from "../../../src/models";
import type { MutationUpdateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";

import {
  EVENT_NOT_FOUND_ERROR,
  LENGTH_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import { addWeeks } from "date-fns";
import { RecurrenceRule } from "../../../src/models/RecurrenceRule";
import { fail } from "assert";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEvent: TestEventType;
let testSingleEvent: TestEventType;
let testRecurringEvent: TestEventType;
let testRecurringEventInstance: TestEventType;
let testRecurringEventException: TestEventType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);

  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  testEvent = await Event.create({
    creatorId: testUser?._id,
    registrants: [{ userId: testUser?._id, user: testUser?._id }],
    organization: testOrganization?._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: convertToUTCDate(new Date()).toString(),
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $set: {
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
      },
    },
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
        );
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateEvent: updateEventResolver } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
        );
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`updates the event with _id === args.id and returns the updated event`, async () => {
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          eventAdmin: testEvent?._id,
        },
      },
    );

    const args: MutationUpdateEventArgs = {
      id: testEvent?._id,
      data: {
        allDay: false,
        description: "newDescription",
        endDate: new Date().toUTCString(),
        endTime: new Date().toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        startDate: new Date().toUTCString(),
        startTime: new Date().toUTCString(),
        title: "newTitle",
        recurrance: "DAILY",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testUpdateEventPayload = await Event.findOne({
      _id: testEvent?._id,
    }).lean();

    expect(updateEventPayload).toEqual(testUpdateEventPayload);
  });

  it(`updates the single event with _id === args.id to be recurring and returns a recurring instance`, async () => {
    const testSingleEvent1 = await Event.create({
      creatorId: testUser?._id,
      registrants: [{ userId: testUser?._id, user: testUser?._id }],
      organization: testOrganization?._id,
      isRegisterable: true,
      isPublic: true,
      location: "location2",
      title: "title2",
      admins: [testUser?._id],
      description: "description2",
      allDay: true,
      recurrance: "WEEKLY",
      startDate: convertToUTCDate(new Date()),
      endDate: addWeeks(convertToUTCDate(new Date()), 10),
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          eventAdmin: testSingleEvent1._id,
          createdEvents: testSingleEvent1._id,
          registeredEvents: testSingleEvent1._id,
        },
      },
    );

    const args: MutationUpdateEventArgs = {
      id: testSingleEvent1?._id,
      data: {
        recurring: true,
        title: "made recurring",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testSingleEventExists = await Event.exists({
      _id: testSingleEvent1?._id,
    });

    expect(testSingleEventExists).toBeFalsy();

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "made recurring",
        description: "description2",
        isPublic: true,
        isRegisterable: true,
        location: "location2",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates the single event with _id === args.id to be infinitely recurring`, async () => {
    const startDate = convertToUTCDate(new Date());
    const endDate = convertToUTCDate(addWeeks(startDate, 4));

    testSingleEvent = await Event.create({
      creatorId: testUser?._id,
      registrants: [{ userId: testUser?._id, user: testUser?._id }],
      organization: testOrganization?._id,
      isRegisterable: true,
      isPublic: true,
      location: "location3",
      title: "title3",
      admins: [testUser?._id],
      description: "description3",
      allDay: true,
      recurrance: "WEEKLY",
      startDate,
      endDate,
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          eventAdmin: testSingleEvent._id,
          createdEvents: testSingleEvent._id,
          registeredEvents: testSingleEvent._id,
        },
      },
    );

    const args: MutationUpdateEventArgs = {
      id: testSingleEvent?._id,
      data: {
        recurring: true,
        endDate: null,
        title: "infinitely recurring",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testSingleEventExists = await Event.exists({
      _id: testSingleEvent?._id,
    });

    expect(testSingleEventExists).toBeFalsy();

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "infinitely recurring",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    // assign the returned recurring event instance to the testRecurringEvent
    testRecurringEvent = updateEventPayload as TestEventType;

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toBe(null);
    expect(baseRecurringEvent?.endDate).toBe(null);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this instance of a recurring event with _id === args.id`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEvent?._id,
      data: {
        title: "updated this instance",
      },
      recurringEventUpdateType: "ThisInstance",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated this instance",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toBe(null);
    expect(baseRecurringEvent?.endDate).toBe(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "infinitely recurring",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates all instances of the recurring event belonging to the recurrence pattern of event with _id === args.id`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEvent?._id,
      data: {
        title: "updated all instance",
      },
      recurringEventUpdateType: "AllInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated all instance",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toBe(null);
    expect(baseRecurringEvent?.endDate).toBe(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated all instance",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this and following instances of recurring event belonging to the recurrence pattern of event with _id === args.id`, async () => {
    // find a recurring instance 4 weeks ahead of the testRecurringEvent
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    testRecurringEventInstance = recurringInstances[4];

    const args: MutationUpdateEventArgs = {
      id: testRecurringEventInstance?._id,
      data: {
        title: "updated this and following instances",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toBe(null);
    expect(baseRecurringEvent?.endDate).toBe(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this and following instances of recurring event to follow a new recurrence pattern`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEventInstance?._id,
      data: {
        title: "updated the recurrence rule of this and following instances",
      },
      recurrenceRuleData: {
        frequency: "DAILY",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    testRecurringEventInstance = updateEventPayload as TestEventType;

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toBe(null);
    expect(recurrenceRule?.frequency).toEqual("DAILY");
    expect(baseRecurringEvent?.endDate).toBe(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this and following instances of recurring event to follow a new recurrence rule and have a specified endDate`, async () => {
    const newEndDate = convertToUTCDate(
      addWeeks(testRecurringEventInstance?.startDate as string, 30),
    );

    const args: MutationUpdateEventArgs = {
      id: testRecurringEventInstance?._id,
      data: {
        title: "updated the recurrence rule of this and following instances",
        endDate: newEndDate,
      },
      recurrenceRuleData: {
        frequency: "WEEKLY",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    testRecurringEventInstance = updateEventPayload as TestEventType;

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toEqual(newEndDate);
    expect(recurrenceRule?.frequency).toEqual("WEEKLY");
    expect(baseRecurringEvent?.endDate).toEqual(newEndDate);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates all instances of recurring event again`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEventInstance?._id,
      data: {
        title: "updated all instances again",
      },
      recurringEventUpdateType: "AllInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated all instances again",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    testRecurringEventInstance = updateEventPayload as TestEventType;

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated all instances again",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this and following instances of recurring event to follow a new recurrence rule infinitely again`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEventInstance?._id,
      data: {
        title: "updated the recurrence rule of this and following instances",
        endDate: null,
      },
      recurrenceRuleData: {
        frequency: "DAILY",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    testRecurringEventInstance = updateEventPayload as TestEventType;

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).toEqual(null);
    expect(recurrenceRule?.frequency).toEqual("DAILY");
    expect(baseRecurringEvent?.endDate).toEqual(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updates this and following instances of recurring event that were following the old recurrence rule`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEvent?._id,
      data: {
        title: "instances following the old recurrence rule",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "instances following the old recurrence rule",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).not.toEqual(null);
    expect(recurrenceRule?.frequency).toEqual("WEEKLY");
    expect(baseRecurringEvent?.endDate).toEqual(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updating this instance to be an exception`, async () => {
    // find an instance two weeks ahead of the testRecurringEvent
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    testRecurringEventException = recurringInstances[2];

    const args: MutationUpdateEventArgs = {
      id: testRecurringEventException?._id,
      data: {
        title: "exception instance",
        isRecurringEventException: true,
      },
      recurringEventUpdateType: "ThisInstance",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "exception instance",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        isRecurringEventException: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).not.toEqual(null);
    expect(recurrenceRule?.frequency).toEqual("WEEKLY");
    expect(baseRecurringEvent?.endDate).toEqual(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });

  it(`updating all instances again to confirm no effect on the exception instance`, async () => {
    const args: MutationUpdateEventArgs = {
      id: testRecurringEvent?._id,
      data: {
        title: "update all but the exception",
      },
      recurringEventUpdateType: "AllInstances",
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    expect(updateEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "update all but the exception",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        isRecurringEventException: false,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    testRecurringEventInstance = updateEventPayload as TestEventType;

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: updateEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: updateEventPayload?.baseRecurringEventId,
    });

    expect(recurrenceRule?.endDate).not.toEqual(null);
    expect(recurrenceRule?.frequency).toEqual("WEEKLY");
    expect(baseRecurringEvent?.endDate).toEqual(null);

    expect(baseRecurringEvent).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "updated the recurrence rule of this and following instances",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const exceptionInstance = await Event.findOne({
      _id: testRecurringEventException?._id,
    });

    expect(exceptionInstance).toEqual(
      expect.objectContaining({
        allDay: true,
        title: "exception instance",
        description: "description3",
        isPublic: true,
        isRegisterable: true,
        isRecurringEventException: true,
        location: "location3",
        recurring: true,
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: updateEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([updateEventPayload?._id]),
        createdEvents: expect.arrayContaining([updateEventPayload?._id]),
        registeredEvents: expect.arrayContaining([updateEventPayload?._id]),
      }),
    );
  });
});

describe("Check for validation conditions", () => {
  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent?._id,
        data: {
          allDay: false,
          description: "Random",
          endDate: "Tue Feb 15 2023",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "Random",
          recurring: false,
          startDate: "Tue Feb 14 2023",
          startTime: "",
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateEvent: updateEventResolverError } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
        );
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if description is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent?._id,
        data: {
          allDay: false,
          description:
            "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          endDate: "Tue Feb 15 2023",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "Random",
          recurring: false,
          startDate: "Tue Feb 14 2023",
          startTime: "",
          title: "Random",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateEvent: updateEventResolverError } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
        );
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if location is greater than 50 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent?._id,
        data: {
          allDay: false,
          description: "Random",
          endDate: "Tue Feb 15 2023",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "d1pPXhLzeHrqzWP4e4Zs3R32QxPN0qqc9Dilr6QcsK1sXDAa9VR",
          recurring: false,
          startDate: "Tue Feb 14 2023",
          startTime: "",
          title: "Random",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateEvent: updateEventResolverError } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`,
        );
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });
  it(`throws Date Validation error if start date is greater than end date`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent?._id,
        data: {
          allDay: false,
          description: "Random",
          endDate: "Tue Feb 13 2023",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "Random",
          recurring: false,
          startDate: "Tue Feb 14 2023",
          startTime: "",
          title: "Random",
          recurrance: "DAILY",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateEvent: updateEventResolverError } = await import(
        "../../../src/resolvers/Mutation/updateEvent"
      );

      await updateEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `start date must be earlier than end date`,
        );
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });
});
