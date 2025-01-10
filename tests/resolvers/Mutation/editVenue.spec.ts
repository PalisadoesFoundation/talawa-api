import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  Organization,
  Venue,
  type InterfaceVenue,
  AppUserProfile,
} from "../../../src/models";
import type { MutationEditVenueArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { ConflictError } from "./../../../src/libraries/errors/conflictError";
import { InvalidFileTypeError } from "./../../../src/libraries/errors/invalidFileTypeError";

import { fail } from "assert";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  INVALID_FILE_TYPE,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  VENUE_NAME_MISSING_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  InputValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../../../src/libraries/errors";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testVenue: InterfaceVenue;

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

  testVenue = await Venue.create({
    name: "venue",
    description: "description",
    capacity: Math.floor(Math.random() * 100),
    organization: new Types.ObjectId().toString(),
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
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
          id: new Types.ObjectId().toString(),
          capacity: 10,
          name: "testVenue",
          description: "description",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
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

  it(`throws NotFoundError if no venue exists with _id === args.data._id`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          id: new Types.ObjectId().toString(),
          capacity: 10,
          name: "testVenue",
          description: "description",
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
        expect(error.message).toEqual(VENUE_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organization`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          id: testVenue?._id.toString(),
          capacity: 10,
          name: "testVenue",
          description: "description",
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

  it(`throws UnauthorizedError if user with _id === context.userId is neither an admin of the organization with _id === args.organization nor a SUPERADMIN`, async () => {
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

      const args: MutationEditVenueArgs = {
        data: {
          id: testVenue?._id.toString(),
          capacity: 10,
          name: "testVenue",
          description: "description",
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
          ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE,
        );
      } else {
        fail(`Expected UnauthorizedError, but got ${error}`);
      }
    }
  });

  it(`throws InputValidationError if the provided venue is empty string`, async () => {
    try {
      testOrganization = await Organization.findByIdAndUpdate(
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
      const args: MutationEditVenueArgs = {
        data: {
          id: testVenue?._id.toString(),
          capacity: 10,
          name: "",
          description: "description",
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
          id: testVenue?._id.toString(),
          capacity: 10,
          name: "testVenue",
          description: "description",
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
        fail(`Expected ConflictError, but got ${error}`);
      }
    }
  });

  it(`throws error for invalid file type`, async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          id: testVenue?._id.toString(),
          capacity: 90,
          name: "newTestVenue",
          description: "newDescription",
          file: "data:image/",
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
      if (error instanceof InvalidFileTypeError) {
        expect(error.message).toEqual(INVALID_FILE_TYPE.MESSAGE);
      } else {
        fail(`Expected InvalidFileTypeError, but got ${error}`);
      }
    }
  });

  it(`Edits the provided venue inside the provided organization`, async () => {
    const args: MutationEditVenueArgs = {
      data: {
        id: testVenue?._id.toString(),
        capacity: 90,
        name: "newTestVenue",
        description: "newDescription",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { editVenue } = await import(
      "../../../src/resolvers/Mutation/editVenue"
    );
    const venue = await editVenue?.({}, args, context);
    const expectedVenue = await Venue.findById(testVenue?._id)
      .populate("organization")
      .lean();
    expect(venue).toEqual(expectedVenue);
  });

  it("uploads file succesfully if the file is valid", async () => {
    const args: MutationEditVenueArgs = {
      data: {
        id: testVenue?._id.toString(),
        file: "data:image/png;base64,",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { editVenue } = await import(
      "../../../src/resolvers/Mutation/editVenue"
    );
    const venue = await editVenue?.({}, args, context);
    const expectedVenue = await Venue.findById(testVenue?._id)
      .populate("organization")
      .lean();
    expect(venue).toEqual(expectedVenue);
  });

  it("throws user not found error if current user profile is not found", async () => {
    try {
      const args: MutationEditVenueArgs = {
        data: {
          id: testVenue?._id.toString(),
          capacity: 90,
          name: "newTestVenue",
          description: "newDescription",
        },
      };

      await AppUserProfile.deleteOne({
        userId: testUser?.id,
      });

      const context = {
        userId: testUser?.id,
      };

      const { editVenue } = await import(
        "../../../src/resolvers/Mutation/editVenue"
      );
      await editVenue?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });
});
