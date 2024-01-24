import { TestEventType } from "./../../helpers/eventsWithRegistrants";
import { TestVenueType, createTestVenue } from "./../../helpers/venue";
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, Event } from "../../../src/models";
import type { MutationCreateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
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
} from "../../../src/libraries/errors";
import { fail } from "assert";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testVenueA: TestVenueType;
let testVenueB: TestVenueType;
let testVenueC: TestVenueType;
let MONGOOSE_INSTANCE: typeof mongoose;
let scheduledEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();
  testVenueA = await createTestVenue();
  testVenueB = await createTestVenue();
  testVenueC = await createTestVenue();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: testUser?._id,
    admins: [testUser?._id],
    members: [testUser?._id],
    visibleInSearch: true,
  });

  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        venues: [testVenueA?._id, testVenueB?._id, testVenueB?._id],
      },
    }
  );
  scheduledEvent = await Event.create({
    organization: testOrganization?.id,
    allDay: false,
    description: "Description",
    endDate: new Date("2023-01-29T00:00:00Z"),
    endTime: new Date("2023-01-29T00:00:00Z"),
    isPublic: false,
    isRegisterable: false,
    latitude: 1,
    longitude: 1,
    location: "Location",
    creatorId: testUser?._id,
    recurring: false,
    startDate: new Date("2023-01-01T00:00:00Z"),
    startTime: new Date("2023-01-01T00:00:00Z"),
    title: "Scheduled",
    recurrance: "ONCE",
    venue: testVenueA?._id,
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

describe("resolvers -> Query -> checkVenue", () => {
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
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });
});

it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
  try {
    const args: MutationCreateEventArgs = {
      data: {
        organizationId: testOrganization?.id,
        allDay: false,
        description: "Description",
        endDate: new Date("2023-01-01T00:00:00Z"),
        endTime: new Date("2023-01-01T00:00:00Z"),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "Location",
        recurring: false,
        startDate: new Date("2023-01-29T00:00:00Z"),
        startTime: new Date("2023-01-29T00:00:00Z"),
        title: "TiLareadytle",
        recurrance: "ONCE",
        venue: testVenueA?.id,
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
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    } else {
      fail(`Expected NotFoundError, but got ${error}`);
    }
  }
  it(`throws InputValidationError if end date is before start date`, async () => {
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
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(
          `start date must be earlier than end date`
        );
      } else {
        fail(`Expected DateValidationError, but got ${error}`);
      }
    }
  });
  it(`fetch all the available venues in a time frame`, async () => {
    try {
    } catch (error: unknown) {}
  });
});
