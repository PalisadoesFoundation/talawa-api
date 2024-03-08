import { Organization, Event } from "../../../src/models";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import type { MutationCreateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";

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
        userId: Types.ObjectId().toString(),
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
          description: "",
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
          relatedEvent: Types.ObjectId().toString(),
          description: "",
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

    const result = await createAgendaSectionResolver?.({}, args, context);
    expect(result).toBeDefined();
  });
});
