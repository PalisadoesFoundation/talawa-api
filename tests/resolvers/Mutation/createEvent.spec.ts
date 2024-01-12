import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, EventAttendee } from "../../../src/models";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testUser?._id],
    members: [testUser?._id],
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
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateEventArgs = {};

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
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
          images: ["image_url_1", "image_url_2"],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
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
          recurrance: "DAILY",
          images: ["image_url_1", "image_url_2"],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEvent: createEventResolverError } = await import(
        "../../../src/resolvers/Mutation/createEvent"
      );

      await createEventResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`creates the event and returns it`, async () => {
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
        images: ["image_url_1", "image_url_2"],
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
        title: "newTitle",
        recurrance: "DAILY",
        creator: testUser?._id,
        admins: expect.arrayContaining([testUser?._id]),
        organization: testOrganization?._id,
        images: ["image_url_1", "image_url_2"],
      })
    );

    const attendeeExists = await EventAttendee.exists({
      userId: testUser!._id,
      eventId: createEventPayload!._id,
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
    } catch (error: any) {
      expect(error.message).toEqual(`start date must be earlier than end date`);
    }
  });
  it(`throws Image Validation error if greater then 5 images are uploaded`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
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
          recurrance: "DAILY",
          images: [
            "image_url_1",
            "image_url_2",
            "image_url_3",
            "image_url_4",
            "image_url_5",
            "image_url_6",
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
    } catch (error: any) {
      expect(error.message).toEqual(
        `Event validation failed: images: Up to 5 images are allowed.`
      );
    }
  });
});
