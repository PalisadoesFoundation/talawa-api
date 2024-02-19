import type { TestVenueType } from "./../../helpers/venue";
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, Venue } from "../../../src/models";
import type { MutationDeleteVenueArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import {
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

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: Types.ObjectId().toString(),
    admins: [Types.ObjectId().toString()],
    members: [Types.ObjectId().toString()],
    visibleInSearch: true,
  });

  testVenue = await Venue.create({
    name: "testVenue",
    description: "description",
    capacity: Math.floor(Math.random() * 100),
    organization: Types.ObjectId().toString(),
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
}, 10000);

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteVenue", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationDeleteVenueArgs = {
        id: testVenue?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { deleteVenue } = await import(
        "../../../src/resolvers/Mutation/deleteVenue"
      );

      await deleteVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if the provided venue doesn't exist`, async () => {
    try {
      const args: MutationDeleteVenueArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { deleteVenue } = await import(
        "../../../src/resolvers/Mutation/deleteVenue"
      );
      await deleteVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(VENUE_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.or
  _id: testVenue?.id,ganizationId`, async () => {
    try {
      const args: MutationDeleteVenueArgs = {
        id: testVenue?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { deleteVenue } = await import(
        "../../../src/resolvers/Mutation/deleteVenue"
      );

      await deleteVenue?.({}, args, context);
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
      await Venue.findOneAndUpdate(
        {
          _id: testVenue?._id,
        },
        {
          $set: { organization: testOrganization?._id },
        },
        { new: true },
      );
      const args: MutationDeleteVenueArgs = {
        id: testVenue?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { deleteVenue } = await import(
        "../../../src/resolvers/Mutation/deleteVenue"
      );
      await deleteVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        expect(error.message).toEqual(
          ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE,
        );
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`Deletes the venue inside the provided organization`, async () => {
    await Organization.findByIdAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          admins: [testUser?.id],
        },
      },
      { new: true },
    );
    const args: MutationDeleteVenueArgs = {
      id: testVenue?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const { deleteVenue } = await import(
      "../../../src/resolvers/Mutation/deleteVenue"
    );
    await deleteVenue?.({}, args, context);
    const expectedVenue = await Venue.findById(testVenue?._id);
    expect(expectedVenue).toEqual(null);
  });
});
