import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, EventAttendee, Event } from "../../../src/models";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";

import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import {
  InputValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../../../src/libraries/errors";
import { fail } from "assert";
import { addMonths, format } from "date-fns";
import { Frequency, RecurrenceRule } from "../../../src/models/RecurrenceRule";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

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

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
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
          recurrance: "ONCE",
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
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
          organizationId: Types.ObjectId().toString(),
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
          recurrance: "DAILY",
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

  it(`throws UnauthorizedError if user with _id === context.userId is neither the creator
  nor a member of the organization with _id === args.organizationId`, async () => {
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
          recurrance: "ONCE",
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
      if (error instanceof UnauthorizedError) {
        expect(error.message).toEqual(
          ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE
        );
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`creates the single non-recurring event and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization?._id,
          joinedOrganizations: testOrganization?._id,
        },
      }
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
        recurrance: "ONCE",
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
      })
    );

    const recurringEvents = await Event.find({
      title: "singleEventTitle",
      recurring: false,
      recurrance: "ONCE",
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
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      })
    );
  });

  it(`creates default Weekly recurring instances if the recurrenceRuleData is not provided`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization?._id,
          joinedOrganizations: testOrganization?._id,
        },
      }
    );

    const startDate = new Date();
    const endDate = addMonths(startDate, 1);

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
        recurrance: "WEEKLY",
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
      })
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      startDate,
      endDate,
      frequency: Frequency.WEEKLY,
    });

    const baseRecurringEvent = await Event.findOne({
      isBaseRecurringEvent: true,
      startDate: format(startDate, "yyyy-MM-dd"),
    });

    const recurringEvents = await Event.find({
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRule?._id,
      baseRecurringEventId: baseRecurringEvent?._id,
    }).lean();

    expect(recurringEvents).toBeDefined();
    expect(recurringEvents.length).toBeGreaterThan(1);

    const attendeeExists = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: createEventPayload?._id,
    });

    expect(attendeeExists).toBeTruthy();

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      })
    );
  });

  it(`creates the recurring event based on the recurrenceRuleData`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization?._id,
          joinedOrganizations: testOrganization?._id,
        },
      }
    );

    let startDate = new Date();
    startDate = addMonths(startDate, 1);

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
        title: "newTitle",
        recurrance: "ONCE",
      },
      recurrenceRuleData: {
        frequency: "WEEKLY",
        weekdays: ["TH", "SA"],
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
      })
    );

    const recurrenceRule = await RecurrenceRule.findOne({
      frequency: Frequency.WEEKLY,
      startDate,
    });

    const baseRecurringEvent = await Event.findOne({
      isBaseRecurringEvent: true,
      startDate: format(startDate, "yyyy-MM-dd"),
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
      .select(["eventAdmin", "createdEvents", "registeredEvents"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        eventAdmin: expect.arrayContaining([createEventPayload?._id]),
        createdEvents: expect.arrayContaining([createEventPayload?._id]),
        registeredEvents: expect.arrayContaining([createEventPayload?._id]),
      })
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
        recurrance: "DAILY",
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
      (message) => message
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
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
          recurrance: "DAILY",
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
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if description is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
          title: "Random",
          recurrance: "DAILY",
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
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws String Length Validation error if location is greater than 50 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
          title: "Random",
          recurrance: "DAILY",
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
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`
        );
      } else {
        fail(`Expected LengthValidationError, but got ${error}`);
      }
    }
  });
  it(`throws Date Validation error if start date is greater than end date`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
          recurrance: "DAILY",
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
          `start date must be earlier than end date`
        );
      } else {
        fail(`Expected DateValidationError, but got ${error}`);
      }
    }
  });
});
