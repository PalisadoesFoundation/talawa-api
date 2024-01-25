import { ConflictError } from "./../../../src/libraries/errors/conflictError";
import { TestVenueType } from "./../../helpers/venue";
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, Venue } from "../../../src/models";
import type { MutationEditVenueArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  VENUE_NAME_MISSING_ERROR,
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
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testVenue: TestVenueType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testVenue = await Venue.create({
    name: "testVenue",
    description: "description",
    capacity: Math.floor(Math.random() * 100),
  });
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: Types.ObjectId().toString(),
    admins: [Types.ObjectId().toString()],
    members: [Types.ObjectId().toString()],
    visibleInSearch: true,
  });
  await Organization.findByIdAndUpdate(
    { _id: testOrganization.id },
    {
      $push: {
        venues: [testVenue?._id],
      },
    }
  );

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
}, 10000);

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> editVenue", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          _id: Types.ObjectId().toString(),
          capacity: 10,
          name: "testVenue",
          description: "newDescription",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );

      await editVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.or
  _id: testVenue?.id,ganizationId`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          _id: Types.ObjectId().toString(),
          capacity: 10,
          name: "testVenue",
          description: "newDescription",
          organizationId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );

      await editVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an admin of the organization with _id === args.organizationId nor a SUPERADMIN`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          _id: testVenue?.id,
          capacity: 10,
          name: "testVenue",
          description: "newDescription",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );
      await editVenue?.({}, args, context);
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

  it(`throws InputValidationError if the provided venue is empty string`, async () => {
    try {
      await Organization.findByIdAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: [testUser?.id],
          },
        }
      );
      const args: MutationEditVenueArgs = {
        data: {
          _id: testVenue?.id,
          capacity: 10,
          name: "",
          description: "newDescription",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );
      await editVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InputValidationError) {
        expect(error.message).toEqual(VENUE_NAME_MISSING_ERROR.MESSAGE);
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });

  it(`throws ConflictError if a venue with same place already exists in the organization`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          _id: testVenue?.id,
          capacity: 10,
          name: "testVenue",
          description: "newDescription",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );
      await editVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof ConflictError) {
        expect(error.message).toEqual(VENUE_ALREADY_EXISTS_ERROR.MESSAGE);
      } else {
        fail(`Expected InputValidationError, but got ${error}`);
      }
    }
  });

  it(`Edits the provided venue inside the provided organization`, async () => {
    const args: MutationEditVenueArgs = {
      data: {
        _id: testVenue?.id,
        capacity: 90,
        name: "newTestVenue",
        description: "newDescription",
        organizationId: testOrganization?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { editVenue } = await import(
      "../../../src/resolvers/Mutation/editVenue"
    );
    const venue = await editVenue?.({}, args, context);
    const organization = await Organization.findById({
      _id: testOrganization?.id,
    })
      .populate("venues")
      .lean();
    expect(organization?.venues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: venue?._id,
          name: venue?.name,
          description: venue?.description,
          capacity: venue?.capacity,
        }),
      ])
    );
  });
});
