import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  AppUserProfile,
  Event,
  EventAttendee,
  Organization,
  User,
  RecurrenceRule,
} from "../../../src/models";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";

import { fail } from "assert";
import { addDays, addMonths } from "date-fns";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  InputValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../../../src/libraries/errors";

import {
  convertToUTCDate,
  countTotalMondaysInMonth,
} from "../../../src/utilities/recurrenceDatesUtil";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);

  testUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: testUser?._id,
    admins: [testUser?._id],
    members: [testUser?._id],
    visibleInSearch: true,
  });

  await AppUserProfile.updateOne(
    {
      userId: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
        createdOrganizations: testOrganization?._id,
      },
    },
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
          images: null,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === id=args.data.organizationId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: "id=" + new Types.ObjectId().toString(),
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
          images: null,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither a superadmin, an admin of the organization, or a member of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
          allDay: false,
          description: "",
          endDate: "",
          endTime: "",
          isPublic: false,
          isRegisterable: false,
          latitude: 1,
          longitude: 1,
          location: "",
          recurring: false,
          startDate: "",
          startTime: "",
          title: "",
          images: ["image_url_1", "image_url_2", "image_url_3", "image_url_4"],
        },
      };

      const randomTestUser = await createTestUser();

      const context = {
        userId: randomTestUser?._id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`creates a single non-recurring event and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          joinedOrganizations: testOrganization?._id,
        },
      },
    );
    await AppUserProfile.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization?._id,
          adminFor: testOrganization?._id,
        },
      },
    );

    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
        allDay: false,
        description: "newDescription",
        endDate: new Date("2023-01-29T00:00:00Z"),
        endTime: new Date().toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        startDate: new Date("2023-01-01T00:00:00Z"),
        startTime: new Date().toUTCString(),
        title: "singleEventTitle",
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

    expect(createEventPayload).toEqual(
      expect.objectContaining({
        allDay: false,
        description: "newDescription",
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        title: "singleEventTitle",
        creatorId: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
      }),
    );

    const recurringEvents = await Event.find({
      title: "singleEventTitle",
      recurring: false,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(1);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a recurring event with default infinite weekly recurrence, if the recurrenceRuleData is not provided`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);

    let endDate = addDays(startDate, 2);
    endDate = convertToUTCDate(endDate);

    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
        allDay: false,
        description: "newDescription",
        endDate,
        endTime: endDate.toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: true,
        startDate,
        startTime: startDate.toUTCString(),
        title: "newTitle",
        images: ["image_url_1", "image_url_2", "image_url_3", "image_url_4"],
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

    expect(createEventPayload).toEqual(
      expect.objectContaining({
        allDay: false,
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();

    expect(recurrenceRule?.recurrenceStartDate).toEqual(startDate);
    expect(recurrenceRule?.recurrenceEndDate).toBeNull();

    expect(baseRecurringEvent?.startDate).toEqual(startDate);
    expect(baseRecurringEvent?.endDate).toBeNull();

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a daily recurring event upto an end date based on the recurrenceRuleData`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);
    const endDate = startDate;

    const recurrenceEndDate = addMonths(startDate, 5);

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
        startTime: startDate.toUTCString(),
        endDate,
        endTime: endDate.toUTCString(),
        title: "newTitle",
      },
      recurrenceRuleData: {
        recurrenceStartDate: startDate,
        recurrenceEndDate,
        frequency: "DAILY",
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();

    expect(recurrenceRule?.recurrenceStartDate).toEqual(startDate);
    expect(recurrenceRule?.recurrenceEndDate).toEqual(recurrenceEndDate);

    expect(baseRecurringEvent?.startDate).toEqual(startDate);
    expect(baseRecurringEvent?.endDate).toEqual(recurrenceEndDate);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a daily recurring event upto a certain number of occurences based on the recurrenceRuleData`, async () => {
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
        frequency: "DAILY",
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a weekly recurring event upto a certain number of occurences based on the recurrenceRuleData`, async () => {
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
        weekDays: ["THURSDAY", "SATURDAY"],
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a monthly recurring event upto a certain number of occurences based on the recurrenceRuleData`, async () => {
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
        frequency: "MONTHLY",
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a yearly recurring event upto a certain number of occurences based on the recurrenceRuleData`, async () => {
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
        frequency: "YEARLY",
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a biweekly recurring event upto a certain number of occurences on the recurrenceRuleData`, async () => {
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
        interval: 2,
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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a monthly recurring event that occurs on every first Monday of the month`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);

    startDate.setDate(1);

    // Turn into the first monday of the month
    if (startDate.getDay() !== 1) {
      startDate.setDate(
        startDate.getDate() + ((1 + 7 - startDate.getDay()) % 7),
      );
    }

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
        frequency: "MONTHLY",
        weekDays: ["MONDAY"],
        count: 10,
        weekDayOccurenceInMonth: 1,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    for (const recurringEventInstance of recurringEvents) {
      const recurringEventInstanceDate = new Date(
        recurringEventInstance.startDate,
      );

      // get the day of the week
      const dayOfWeek = recurringEventInstanceDate.getDay();

      // get the current occurrence of week day in month
      const dayOfMonth = recurringEventInstanceDate.getDate();
      const occurrence = Math.ceil(dayOfMonth / 7);

      expect(dayOfWeek).toEqual(1);
      expect(occurrence).toEqual(1);
    }

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  it(`creates a monthly recurring event that occurs on every last Monday of the month`, async () => {
    let startDate = new Date();
    startDate = convertToUTCDate(startDate);

    startDate.setDate(0);

    // Turn into the first monday of the month
    while (startDate.getDay() !== 1) {
      // Subtract one day until we get to a Monday
      startDate.setDate(startDate.getDate() - 1);
    }

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
        frequency: "MONTHLY",
        weekDays: ["MONDAY"],
        count: 10,
        weekDayOccurenceInMonth: -1,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    const createEventPayload = await createEventResolver?.({}, args, context);

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

    const recurrenceRule = await RecurrenceRule.findOne({
      _id: createEventPayload?.recurrenceRuleId,
    });

    const baseRecurringEvent = await Event.findOne({
      _id: createEventPayload?.baseRecurringEventId,
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents).toHaveLength(10);

    for (const recurringEventInstance of recurringEvents) {
      const recurringEventInstanceDate = new Date(
        recurringEventInstance.startDate,
      );

      // get the day of the week
      const dayOfWeek = recurringEventInstanceDate.getDay();

      // get the current occurrence of week day in month
      const dayOfMonth = recurringEventInstanceDate.getDate();
      const occurrence = Math.ceil(dayOfMonth / 7);

      // get total occurences of monday in the month
      // it will also be the last occurence of monday in that month
      const totalOccurencesOfMonday = countTotalMondaysInMonth(
        recurringEventInstanceDate,
      );

      expect(dayOfWeek).toEqual(1);
      expect(occurrence).toEqual(totalOccurencesOfMonday);
    }

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    const updatedTestUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdEvents"])
      .select(["eventAdmin"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      }),
    );

    expect(updatedTestUserAppProfile).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
      }),
    );
  });

  /* Commenting out this test because we are not using firebase notification anymore.
  
  it("should send a message when user and user.token exists", async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          token: "random",
        },
      }
    );

    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
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
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const admin = await import("firebase-admin");

    const spy = vi
      .spyOn(admin.messaging(), "send")
      .mockImplementationOnce(async () => `Message sent`);

    const { createEvent: createEventResolver } = await import(
      "../../../src/resolvers/Mutation/createEvent"
    );

    await createEventResolver?.({}, args, context);
    expect(spy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
    vi.resetModules();
  });
   */
});

describe("Check for validation conditions", () => {
  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
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
          images: [
            "image_url_1",
            "image_url_2",
            "image_url_3",
            "image_url_4",
            "image_url_5",
          ],
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if description is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
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
          images: [
            "image_url_1",
            "image_url_2",
            "image_url_3",
            "image_url_4",
            "image_url_5",
          ],
          title: "Random",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if location is greater than 50 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
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
          images: [
            "image_url_1",
            "image_url_2",
            "image_url_3",
            "image_url_4",
            "image_url_5",
          ],
          title: "Random",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`,
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws Date Validation error if start date is greater than end date`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
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
          images: [
            "image_url_1.jpg",
            "image_url_2.jpg",
            "image_url_3.jpg",
            "image_url_4.jpg",
            "image_url_5.jpg",
          ],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(
          `start date must be earlier than end date`,
        );
      } else {
        fail(`Expected DateValidationError, but got ${error}`);
      }
    }
  });
  it("throws error if the user does not have appUserProfile", async () => {
    try {
      const args: MutationCreateEventArgs = {
        data: {
          organizationId: testOrganization?.id,
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
        },
      };
      await AppUserProfile.deleteOne({
        userId: testUser?._id,
      });
      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
