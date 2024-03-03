import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceEvent } from "../../../src/models";
import { User, Event, ActionItem, EventAttendee } from "../../../src/models";
import type {
  MutationCreateEventArgs,
  MutationRemoveEventArgs,
  MutationUpdateEventArgs,
} from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";

import { removeEvent as removeEventResolver } from "../../../src/resolvers/Mutation/removeEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { createTestActionItems } from "../../helpers/actionItem";
import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import { addMonths } from "date-fns";
import { Frequency, RecurrenceRule } from "../../../src/models/RecurrenceRule";
import { fail } from "assert";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let newTestUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testRecurringEvent: InterfaceEvent;
let newTestEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);

  const temp = await createTestEvent();
  testUser = temp[0];
  testOrganization = temp[1];
  testEvent = temp[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotDoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      if (error instanceof Error) {
        EVENT_NOT_FOUND_ERROR.MESSAGE;
      } else {
        fail(`Expected NotDoundError, but got ${error}`);
      }
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an
  admin of organization with _id === event.organization for event with _id === args.id
  or an admin for event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $set: {
            adminFor: [],
          },
        },
      );

      await Event.updateOne(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
      );

      const args: MutationRemoveEventArgs = {
        id: testEvent?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      if (error instanceof Error) {
        USER_NOT_AUTHORIZED_ERROR.MESSAGE;
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`removes the single(non-recurring) event with _id === args.id and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          adminFor: testOrganization?._id,
        },
      },
    );

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
    );

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }

    const args: MutationRemoveEventArgs = {
      id: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual({
      ...testEvent?.toObject(),
      updatedAt: expect.anything(),
    });

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["createdEvents", "eventAdmin"])
      .lean();

    expect(updatedTestUser?.createdEvents).toEqual([]);
    expect(updatedTestUser?.eventAdmin).toEqual([]);

    const testEventExists = await Event.exists({
      _id: testEvent?._id,
    });

    expect(testEventExists).toBeFalsy();
  });

  it(`removes the events and all action items assiciated with it`, async () => {
    [newTestUser, newTestEvent] = await createTestActionItems();

    const args: MutationRemoveEventArgs = {
      id: newTestEvent?.id,
    };

    const context = {
      userId: newTestUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(newTestEvent?.toObject());

    const deletedActionItems = await ActionItem.find({
      eventId: newTestEvent?._id,
    });

    expect(deletedActionItems).toEqual([]);
  });

  it(`removes a single instance of a recurring event`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);

    const endDate = addMonths(startDate, 6);

    const createEventArgs: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
        allDay: true,
        description: "newDescription",
        endDate,
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        startDate,
        title: "newTitle",
        recurrance: "WEEKLY",
      },
    };

    const createEventContext = {
      userId: testUser?.id,
    };

    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    testRecurringEvent = (await createEventResolver?.(
      {},
      createEventArgs,
      createEventContext,
    )) as InterfaceEvent;

    const recurrenceRule = await RecurrenceRule.findOne({
      startDate,
      endDate,
      frequency: Frequency.WEEKLY,
    });

    const baseRecurringEvent = await Event.findOne({
      isBaseRecurringEvent: true,
      startDate: startDate.toUTCString(),
    });

    // find an event one week ahead of the testRecurringEvent and delete it
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    const recurringEventInstance = recurringInstances[1];

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "ThisInstance",
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        recurrenceRuleId: recurrenceRule?._id.toString(),
        baseRecurringEventId: baseRecurringEvent?._id.toString(),
        startDate: recurringEventInstance.startDate,
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

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`removes this and following instances of the recurring event`, async () => {
    // find an event 10 weeks ahead of the testRecurringEvent
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    const recurringEventInstance = recurringInstances[10];

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        recurrenceRuleId: recurringEventInstance.recurrenceRuleId.toString(),
        baseRecurringEventId:
          recurringEventInstance.baseRecurringEventId.toString(),
        startDate: recurringEventInstance.startDate,
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

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`changes the recurrencerule and deletes the new series`, async () => {
    // find an event 7 weeks ahead of the testRecurringEvent
    // and update it to follow a new recurrence series
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    let recurringEventInstance = recurringInstances[7] as InterfaceEvent;

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const updateEventArgs: MutationUpdateEventArgs = {
      id: recurringEventInstance?._id.toString(),
      data: {
        title: "update the recurrence rule of this and following instances",
      },
      recurrenceRuleData: {
        frequency: "DAILY",
      },
      recurringEventUpdateType: "ThisAndFollowingInstances",
    };

    const updateEventContext = {
      userId: testUser?._id,
    };

    const { updateEvent: updateEventResolver } = await import(
      "../../../src/resolvers/Mutation/updateEvent"
    );

    recurringEventInstance = (await updateEventResolver?.(
      {},
      updateEventArgs,
      updateEventContext,
    )) as InterfaceEvent;

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "ThisAndFollowingInstances",
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        recurrenceRuleId: recurringEventInstance.recurrenceRuleId.toString(),
        baseRecurringEventId:
          recurringEventInstance.baseRecurringEventId.toString(),
        startDate: recurringEventInstance.startDate,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        title: "update the recurrence rule of this and following instances",
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`removes all the instances of a recurring event except the exception instance`, async () => {
    // find an event 6 weeks ahead of the testRecurringEvent
    // and make it an exception
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });

    const recurringEventExceptionInstance =
      recurringInstances[6] as InterfaceEvent;

    const exceptionInstanceAttendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventExceptionInstance?._id,
    });

    expect(exceptionInstanceAttendeeExists).toBeTruthy();

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: testRecurringEvent?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([
          testRecurringEvent?._id,
          recurringEventExceptionInstance?._id,
        ]),
        createdEvents: expect.arrayContaining([
          testRecurringEvent?._id,
          recurringEventExceptionInstance?._id,
        ]),
        registeredEvents: expect.arrayContaining([
          testRecurringEvent?._id,
          recurringEventExceptionInstance?._id,
        ]),
      }),
    );

    await Event.updateOne(
      {
        _id: recurringEventExceptionInstance?._id,
      },
      {
        isRecurringEventException: true,
      },
    );

    const args: MutationRemoveEventArgs = {
      id: testRecurringEvent?._id.toString(),
      recurringEventDeleteType: "AllInstances",
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(
      expect.objectContaining({
        allDay: true,
        description: "newDescription",
        isPublic: false,
        recurrenceRuleId: testRecurringEvent.recurrenceRuleId.toString(),
        baseRecurringEventId:
          testRecurringEvent.baseRecurringEventId.toString(),
        startDate: testRecurringEvent.startDate,
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

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: testRecurringEvent?._id,
    });

    expect(attendeeExists).toBeFalsy();

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventExceptionInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([testRecurringEvent?._id]),
        createdEvents: expect.not.arrayContaining([testRecurringEvent?._id]),
        registeredEvents: expect.not.arrayContaining([testRecurringEvent?._id]),
      }),
    );

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
        createdEvents: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
        registeredEvents: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
      }),
    );
  });
});
