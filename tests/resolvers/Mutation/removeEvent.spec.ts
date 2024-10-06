import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceEvent } from "../../../src/models";
import {
  ActionItem,
  AppUserProfile,
  Event,
  EventAttendee,
  User,
  RecurrenceRule,
} from "../../../src/models";
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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  BASE_RECURRING_EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_ERROR,
  RECURRENCE_RULE_NOT_FOUND,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { removeEvent as removeEventResolver } from "../../../src/resolvers/Mutation/removeEvent";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";
import { createTestActionItems } from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { fail } from "assert";
import { convertToUTCDate } from "../../../src/utilities/recurrenceDatesUtil";
import { addMonths } from "date-fns";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let newTestUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let newTestEvent: TestEventType;
let testRecurringEvent: InterfaceEvent;

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
        userId: new Types.ObjectId().toString(),
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
        fail(`Expected NotFoundError, but got ${error}`);
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
        id: new Types.ObjectId().toString(),
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
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
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
      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
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
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`removes event with _id === args.id and returns it`, async () => {
    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
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

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })

      .select(["createdEvents", "eventAdmin"])
      .lean();

    expect(updatedTestUserAppProfile?.createdEvents).toEqual([]);
    expect(updatedTestUserAppProfile?.eventAdmin).toEqual([]);

    const testEventExists = await Event.exists({
      _id: testEvent?._id,
    });

    expect(testEventExists).toBeFalsy();
  });

  it(`removes the events and all action items assiciated with it`, async () => {
    [newTestUser, , newTestEvent] = await createTestActionItems();

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
    const endDate = startDate;

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
      },
      recurrenceRuleData: {
        recurrenceStartDate: startDate,
        recurrenceEndDate: convertToUTCDate(addMonths(startDate, 6)),
        frequency: "WEEKLY",
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
      _id: testRecurringEvent.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
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
      .select(["registeredEvents"])
      .lean();

    let updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "thisInstance",
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
      .select(["registeredEvents"])
      .lean();

    updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`removes this and following instances of the recurring event`, async () => {
    // find an event 10 weeks ahead of the testRecurringEvent
    // and delete the instances ahead from there
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });
    const recurringEventInstance = recurringInstances[10];

    // find the instance 9 weeks ahead of the testRecurringEvent that wouldn't be deleted
    // i.e. it would be the latest instance remaining for that recurrence rule
    const latestRecurringEventInstance = recurringInstances[9];

    let recurrenceRule = await RecurrenceRule.findOne({
      _id: testRecurringEvent.recurrenceRuleId,
    });

    let baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
    });

    expect(recurrenceRule?.recurrenceEndDate).not.toEqual(
      latestRecurringEventInstance.endDate,
    );
    expect(baseRecurringEvent?.endDate).not.toEqual(
      latestRecurringEventInstance.endDate,
    );

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    let updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "thisAndFollowingInstances",
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

    recurrenceRule = await RecurrenceRule.findOne({
      _id: testRecurringEvent.recurrenceRuleId,
    });

    baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
    });

    expect(recurrenceRule?.recurrenceEndDate).toEqual(
      latestRecurringEventInstance.endDate,
    );
    expect(baseRecurringEvent?.endDate).toEqual(
      latestRecurringEventInstance.endDate,
    );

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`changes the recurrencerule and deletes the new series`, async () => {
    // find an event 7 weeks ahead of the testRecurringEvent
    // and update this and following instance to follow a new recurrence series
    const recurringInstances = await Event.find({
      recurrenceRuleId: testRecurringEvent?.recurrenceRuleId,
    });
    let recurringEventInstance = recurringInstances[7] as InterfaceEvent;

    // find the new latestInstance of for the current recurrence rule
    const latestRecurringEventInstance = recurringInstances[6];

    let recurrenceRule = await RecurrenceRule.findOne({
      _id: testRecurringEvent.recurrenceRuleId,
    });

    let baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
    });

    expect(recurrenceRule?.recurrenceEndDate).not.toEqual(
      latestRecurringEventInstance.endDate,
    );
    expect(baseRecurringEvent?.endDate).not.toEqual(
      latestRecurringEventInstance.endDate,
    );

    let attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeTruthy();

    let updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    let updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const updateEventArgs: MutationUpdateEventArgs = {
      id: recurringEventInstance?._id.toString(),
      data: {
        title: "update the recurrence rule of this and following instances",
      },
      recurrenceRuleData: {
        recurrenceStartDate: recurringEventInstance.startDate,
        recurrenceEndDate: convertToUTCDate(
          addMonths(recurringEventInstance.startDate, 6),
        ),
        frequency: "DAILY",
      },
      recurringEventUpdateType: "thisAndFollowingInstances",
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
      recurringEventDeleteType: "thisAndFollowingInstances",
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

    recurrenceRule = await RecurrenceRule.findOne({
      _id: testRecurringEvent.recurrenceRuleId,
    });

    baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
    });

    expect(recurrenceRule?.recurrenceEndDate).toEqual(
      latestRecurringEventInstance.endDate,
    );
    expect(baseRecurringEvent?.endDate).toEqual(
      latestRecurringEventInstance.endDate,
    );

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
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
      .select(["registeredEvents"])
      .lean();

    let updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([
          testRecurringEvent?._id,
          recurringEventExceptionInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([
          testRecurringEvent?._id,
          recurringEventExceptionInstance?._id,
        ]),
        createdEvents: expect.arrayContaining([
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
      recurringEventDeleteType: "allInstances",
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
      .select(["registeredEvents"])
      .lean();

    updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.not.arrayContaining([testRecurringEvent?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([testRecurringEvent?._id]),
        createdEvents: expect.not.arrayContaining([testRecurringEvent?._id]),
      }),
    );

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
        createdEvents: expect.arrayContaining([
          recurringEventExceptionInstance?._id,
        ]),
      }),
    );
  });

  it(`removes the dangling recurrence rule and base recurrening event documents`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);
    const endDate = startDate;

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
      },
      recurrenceRuleData: {
        recurrenceStartDate: startDate,
        recurrenceEndDate: convertToUTCDate(addMonths(startDate, 6)),
        frequency: "WEEKLY",
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
      _id: testRecurringEvent.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: testRecurringEvent.baseRecurringEventId,
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
      .select(["registeredEvents"])
      .lean();

    let updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.arrayContaining([recurringEventInstance?._id]),
      }),
    );

    const args: MutationRemoveEventArgs = {
      id: recurringEventInstance?._id.toString(),
      recurringEventDeleteType: "allInstances",
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

    const recurrenceRuleExist = await RecurrenceRule.exists({
      _id: recurrenceRule?._id,
    });

    const baseRecurringEventExist = await Event.exists({
      _id: baseRecurringEvent?._id,
    });

    expect(recurrenceRuleExist).toBeFalsy();
    expect(baseRecurringEventExist).toBeFalsy();

    attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: recurringEventInstance?._id,
    });

    expect(attendeeExists).toBeFalsy();

    updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        eventAdmin: expect.not.arrayContaining([recurringEventInstance?._id]),
        createdEvents: expect.not.arrayContaining([
          recurringEventInstance?._id,
        ]),
      }),
    );
  });

  it(`throws not found error if the base recurring event doesn't exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      let startDate = new Date();
      startDate = convertToUTCDate(startDate);
      const endDate = startDate;

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
        },
        recurrenceRuleData: {
          recurrenceStartDate: startDate,
          recurrenceEndDate: convertToUTCDate(addMonths(startDate, 6)),
          frequency: "WEEKLY",
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

      // delete the base recurring event
      await Event.deleteOne({
        _id: testRecurringEvent.baseRecurringEventId,
      });

      const args: MutationRemoveEventArgs = {
        id: testRecurringEvent?._id.toString(),
        recurringEventDeleteType: "thisInstance",
      };

      const context = {
        userId: testUser?.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(BASE_RECURRING_EVENT_NOT_FOUND.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${BASE_RECURRING_EVENT_NOT_FOUND.MESSAGE}`,
        );
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws not found error if the recurrence rule  doesn't exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      // delete the base recurrence rule
      await RecurrenceRule.deleteOne({
        _id: testRecurringEvent.recurrenceRuleId,
      });

      const args: MutationRemoveEventArgs = {
        id: testRecurringEvent?._id.toString(),
        recurringEventDeleteType: "thisInstance",
      };

      const context = {
        userId: testUser?.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(RECURRENCE_RULE_NOT_FOUND.MESSAGE);
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${RECURRENCE_RULE_NOT_FOUND.MESSAGE}`,
        );
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it("throws an error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationRemoveEventArgs = {
      id: testEvent?.id,
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );
      await removeEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
