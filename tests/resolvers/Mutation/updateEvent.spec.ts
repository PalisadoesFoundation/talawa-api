import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import type { MutationUpdateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];
  testEvent = await Event.create({
    createdBy: testUser?._id,
    registrants: [{ userId: testUser?._id, user: testUser?._id }],
    organization: testOrganization?._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
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
    }
  );
});

afterAll(async () => {
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
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
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
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
      );
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
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
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
        $set: {
          updatedBy: testUser?._id,
        },
      },
      {
        new: true,
      }
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
      }
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
});

describe("Check for validation conditions", () => {
  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
      );
    }
  });
  it(`throws String Length Validation error if description is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`
      );
    }
  });
  it(`throws String Length Validation error if location is greater than 50 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`
      );
    }
  });
  it(`throws Date Validation error if start date is greater than end date`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
    } catch (error: any) {
      expect(error.message).toEqual(`start date must be earlier than end date`);
    }
  });
});
