import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Event, Organization } from "../../../src/models";
import type { MutationCreateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUser2 = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });
  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
    creatorId: testUser?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAgendaSection", () => {
  it("throws NotFoundError if no user exists with _id === userId", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          relatedEvent: testEvent?._id,
          description: "Sample Description",
          sequence: 1,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { createAgendaSection: createAgendaSectionResolverError } =
        await import("../../../src/resolvers/Mutation/createAgendaSection");

      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("Should throw an error if the event is not found", async () => {
    const args: MutationCreateAgendaSectionArgs = {
      input: {
        relatedEvent: testEvent?._id,
        description: "Description1",
        sequence: 3,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };
    const { createAgendaSection: createAgendaSectionResolverError } =
      await import("../../../src/resolvers/Mutation/createAgendaSection");
    try {
      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not an admin for the related organization", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          relatedEvent: testEvent?._id,
          description: "Description!",
          sequence: 2,
        },
      };

      const context = {
        userId: testUser2?._id,
      };

      const { createAgendaSection: createAgendaSectionResolverError } =
        await import("../../../src/resolvers/Mutation/createAgendaSection");

      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if user is not an admin for the related organization (SUPERADMIN check)", async () => {
    try {
      // Create a new user without organization admin permissions
      const anotherUser = await createTestUser();

      const args: MutationCreateAgendaSectionArgs = {
        input: {
          relatedEvent: testEvent?._id?.toString(),
          description: "Sample desc2",
          sequence: 2,
        },
      };

      const context = {
        userId: anotherUser?._id,
      };

      const { createAgendaSection: createAgendaSectionResolverError } =
        await import("../../../src/resolvers/Mutation/createAgendaSection");

      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if user is not an event admin", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          relatedEvent: testEvent?._id?.toString(),
          description: "sample desc",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { createAgendaSection: createAgendaSectionResolverError } =
        await import("../../../src/resolvers/Mutation/createAgendaSection");

      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if related event is not found", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          relatedEvent: new Types.ObjectId().toString(),
          description: "sample desc 2",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { createAgendaSection: createAgendaSectionResolverError } =
        await import("../../../src/resolvers/Mutation/createAgendaSection");

      await createAgendaSectionResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("creates an agenda section if user is authorized", async () => {
    const args: MutationCreateAgendaSectionArgs = {
      input: {
        relatedEvent: testEvent?._id?.toString(),
        description: "samp desc",
        sequence: 1,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaSection: createAgendaSectionResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaSection"
    );

    const result = await createAgendaSectionResolver?.({}, args, context);
    expect(result).toBeDefined();
  });
  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationCreateAgendaSectionArgs = {
      input: {
        relatedEvent: testEvent?._id?.toString(),
        description: "desc",
        sequence: 1,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaSection: createAgendaSectionResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaSection"
    );
    try {
      await createAgendaSectionResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
