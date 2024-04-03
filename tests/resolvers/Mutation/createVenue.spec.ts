import { InvalidFileTypeError } from "./../../../src/libraries/errors/invalidFileTypeError";
import { ConflictError } from "./../../../src/libraries/errors/conflictError";
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization, Venue } from "../../../src/models";
import type { MutationCreateVenueArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  INVALID_FILE_TYPE,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: new Types.ObjectId().toString(),
    admins: [new Types.ObjectId().toString()],
    members: [new Types.ObjectId().toString()],
    visibleInSearch: true,
  });

  await Venue.create({
    name: "testVenue",
    description: "description",
    capacity: Math.floor(Math.random() * 100),
    organization: testOrganization?.id,
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
}, 10000);

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createVenue", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "testVenue",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );

      await createVenue?.({}, args, context);
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
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "testVenue",
          organizationId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );

      await createVenue?.({}, args, context);
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
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "testVenue",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );
      await createVenue?.({}, args, context);
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
        },
      );
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );
      await createVenue?.({}, args, context);
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
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "testVenue",
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );
      await createVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof ConflictError) {
        expect(error.message).toEqual(VENUE_ALREADY_EXISTS_ERROR.MESSAGE);
      } else {
        fail(`Expected ConflictError, but got ${error}`);
      }
    }
  });

  it(`throws error for invalid file type`, async () => {
    try {
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "newTestVenue",
          organizationId: testOrganization?.id,
          file: "data:image/",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );
      await createVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof InvalidFileTypeError) {
        expect(error.message).toEqual(INVALID_FILE_TYPE.MESSAGE);
      } else {
        fail(`Expected InvalidFileTypeError, but got ${error}`);
      }
    }
  });

  it("uploads file succesfully if the file is valid", async () => {
    const args: MutationCreateVenueArgs = {
      data: {
        capacity: 10,
        name: "fileTestVenue",
        organizationId: testOrganization?.id,
        file: "data:image/png;base64,",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createVenue } = await import(
      "../../../src/resolvers/Mutation/createVenue"
    );
    const venue = await createVenue?.({}, args, context);
    const expectedVenue = await Venue.findById(venue?._id);
    expect(venue).toEqual(
      expect.objectContaining({
        _id: expectedVenue?._id,
      }),
    );
  });

  it(`creates a new venue without image inside the provided organization`, async () => {
    const args: MutationCreateVenueArgs = {
      data: {
        capacity: 10,
        name: "newTestVenue",
        organizationId: testOrganization?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createVenue } = await import(
      "../../../src/resolvers/Mutation/createVenue"
    );
    const venue = await createVenue?.({}, args, context);
    const expectedVenue = await Venue.findById(venue?._id);
    expect(venue).toEqual(
      expect.objectContaining({
        _id: expectedVenue?._id,
      }),
    );
  });

  it("throws user not found error if current user profile is not found", async () => {
    try {
      const args: MutationCreateVenueArgs = {
        data: {
          capacity: 10,
          name: "newTestVenue",
          organizationId: testOrganization?.id,
        },
      };

      await AppUserProfile.deleteOne({
        userId: testUser?.id,
      });

      const context = {
        userId: testUser?.id,
      };

      const { createVenue } = await import(
        "../../../src/resolvers/Mutation/createVenue"
      );

      await createVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });
});
