import mongoose, { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { createAgendaCategory } from "../../../src/resolvers/Mutation/createAgendaCategory";
import {
  User,
  AgendaCategoryModel,
  Organization,
  Event,
} from "../../../src/models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";

import type { MutationCreateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect, Test, vi } from "vitest";
import type { TestEventType } from "../../helpers/events";
let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAdminUser: TestUserType;
let testEvent: TestEventType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
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
  });
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAgendaCategory", () => {
  it("creates a new agenda category successfully", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: testAdminUser?._id,
          organizationId: testOrganization?.id,
          name: "Test Agenda Category",
          description: "Sample desc",
        },
      };
      const context = {
        userId: testAdminUser?._id,
      };
      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");
      const result = await createAgendaCategoryResolver?.({}, args, context);

      expect(result).toBeDefined();
      expect(result?.createdBy).toEqual(testAdminUser?._id.toString());
      expect(result?.organization).toEqual(testOrganization?._id.toString());
      expect(result?.name).toEqual(args.input.name);
      expect(result?.description).toEqual(args.input.description);

      // Fetch the organization to verify the agenda category is associated
      const updatedOrganization = await Organization.findById(
        testOrganization?._id
      ).lean();
      expect(updatedOrganization?.agendaCategories.length).toBeGreaterThan(0);
      expect(result?._id).toBeUndefined();
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });
  it("throws NotFoundError if no user exists with _id === createdByUserId", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: Types.ObjectId().toString(),
          organizationId: testOrganization?.id,
          name: "Category Example2",
          description: "Sample desc2",
        },
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");
      await createAgendaCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no organization exists with _id === input.organizationId", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: testAdminUser?._id,
          organizationId: mongoose.Types.ObjectId().toString(),
          name: "Category Example3",
          description: "Sample desc3",
        },
      };
      const context = {
        userId: testAdminUser?._id,
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");
      await createAgendaCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user does not have necessary permissions", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: testUser2?._id,
          organizationId: testOrganization?.id,
          name: "Category Example4",
          description: "Sample desc4",
        },
      };
      const context = {
        userId: testUser2?._id,
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");
      await createAgendaCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("Successful Creation of Agenda Category", async () => {
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        createdBy: testAdminUser?._id,
        organizationId: testOrganization?.id,
        name: "Category Example5",
        description: "Sample desc5",
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );
    const result = await createAgendaCategoryResolver?.({}, args, context);

    expect(result).toBeDefined();
    expect(result?.createdBy).toEqual(testAdminUser?._id.toString());
    expect(result?.organization).toEqual(testOrganization?._id.toString());

    // Fetch the organization to verify the agenda category is associated
    const updatedOrganization = await Organization.findById(
      testOrganization?._id
    ).lean();
    expect(updatedOrganization?.agendaCategories.length).toBeGreaterThan(0);

    throw new Error("createAgendaCategory resolver is undefined");
  });

  it("Populated Agenda Category", async () => {
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        createdBy: testAdminUser?._id,
        organizationId: testOrganization?.id,
        name: "Test Agenda Category",
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );
    const result = await createAgendaCategoryResolver?.({}, args, context);

    expect(result).toBeDefined();
    expect(result?.createdBy).toBeDefined();
  });

  it("Organization Update", async () => {
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        createdBy: testAdminUser?._id,
        organizationId: testOrganization?.id,
        name: "Test Agenda Category",
        description: "Description",
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );
    await createAgendaCategoryResolver?.({}, args, context);

    // Fetch the organization to verify the agenda category is associated
    const updatedOrganization = await Organization.findById(
      testOrganization?._id
    ).lean();
    expect(updatedOrganization?.agendaCategories.length).toBeGreaterThan(0);
  });

  it("Invalid Input Handling", async () => {
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        createdBy: testAdminUser?._id,
        organizationId: testOrganization?.id,
        name: "Descpt", // Provide an invalid input
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };

    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );
    try {
      await createAgendaCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toContain("validation");
    }
  });
  it("Organization Update", async () => {
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        createdBy: testAdminUser?._id,
        organizationId: testOrganization?.id,
        name: "Test Agenda Category",
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };
    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );
    const result = await createAgendaCategoryResolver?.({}, args, context);

    // Fetch the organization to verify the agenda category is associated
    const updatedOrganization = await Organization.findById(
      testOrganization?._id
    ).lean();
    expect(updatedOrganization?.agendaCategories.length).toBeGreaterThan(0);

    // Check if the organization's agendaCategories array contains the new agenda category
    const hasNewAgendaCategory = updatedOrganization?.agendaCategories.some(
      (category: any) => category._id.toString() === result?._id.toString()
    );
    expect(hasNewAgendaCategory).toBe(true);
  });
});
