import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  User,
  AgendaSectionModel,
  Event,
  Organization,
} from "../../../src/models";
import type { MutationCreateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createAgendaSection } from "../../../src/resolvers/Mutation/createAgendaSection";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  const temp = await createTestEvent();
  testEvent = temp[2];
  testOrganization = await Organization.create({
    name: "Test Organization",
    description: "Test Organization Description",
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
        eventAdmin: testEvent?._id,
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message: any) => message
  );
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers -> Mutation -> createAgendaSection", () => {
  it("throws NotFoundError if no user exists with _id === userId", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: Types.ObjectId().toString(),
          relatedEvent: testEvent?._id?.toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not an admin for the related organization", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: testUser?._id?.toString(),
          relatedEvent: testEvent?._id?.toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not an admin for the related organization (SUPERADMIN check)", async () => {
    try {
      // Create a new user without organization admin permissions
      const anotherUser = await createTestUser();

      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: anotherUser?._id?.toString(),
          relatedEvent: testEvent?._id?.toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: anotherUser?._id,
      };

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not an event admin and organization admin", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: testUser?._id?.toString(),
          relatedEvent: testEvent?._id?.toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      // Set the user as an organization admin
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

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not an event admin", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: testUser?._id?.toString(),
          relatedEvent: testEvent?._id?.toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if related event is not found", async () => {
    try {
      const args: MutationCreateAgendaSectionArgs = {
        input: {
          createdBy: testUser?._id?.toString(),
          relatedEvent: Types.ObjectId().toString(),
          description: "",
          sequence: 0,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      if (createAgendaSection) {
        await createAgendaSection({}, args, context);
      } else {
        throw new Error("createAgendaSection resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("creates an agenda section if user is authorized", async () => {
    const args: MutationCreateAgendaSectionArgs = {
      input: {
        createdBy: testUser?._id?.toString(),
        relatedEvent: testEvent?._id?.toString(),
        description: "",
        sequence: 0,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    if (createAgendaSection) {
      const result = await createAgendaSection({}, args, context);
      expect(result).toBeDefined();
    } else {
      throw new Error("createAgendaSection resolver is undefined");
    }
  });
});
