import mongoose, { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { createAgendaCategory } from "../../../src/resolvers/Mutation/createAgendaCategory";
import { User, AgendaCategoryModel, Organization } from "../../../src/models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestUserType, TestOrganizationType  } from "../../helpers/userAndOrg";

import type { MutationCreateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect, Test } from "vitest";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAdminUser: TestUserType;
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
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAgendaCategory", () => {
  it("throws NotFoundError if no user exists with _id === createdByUserId", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: mongoose.Types.ObjectId().toString(),
          organizationId: testOrganization?.id,
          name: "",
        },
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (createAgendaCategory) {
        await createAgendaCategory({}, args, context);
      } else {
        throw new Error("createAgendaCategory resolver is undefined");
      }
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
          name: "",
        },
      };
      const context = {
        userId: testUser?._id,
      };

      if (createAgendaCategory) {
        await createAgendaCategory({}, args, context);
      } else {
        throw new Error("createAgendaCategory resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user does not have necessary permissions", async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          createdBy: testUser?._id,
          organizationId: testOrganization?.id,
          name: "",
        },
      };
      const context = {
        userId: testUser?._id,
      };

      if (createAgendaCategory) {
        await createAgendaCategory({}, args, context);
      } else {
        throw new Error("createAgendaCategory resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("creates a new agenda category successfully", async () => {
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

    if (createAgendaCategory) {
      const result = await createAgendaCategory({}, args, context);

      expect(result).toBeDefined();
      expect(result.createdBy).toEqual(testUser?._id.toString());
      expect(result.organization).toEqual(testOrganization?._id.toString());

      // Fetch the organization to verify the agenda category is associated
      const updatedOrganization = await Organization.findById(
        testOrganization?._id
      ).lean();
      expect(updatedOrganization?.agendaCategories.length).toBeGreaterThan(0);
    } else {
      throw new Error("createAgendaCategory resolver is undefined");
    }
  });
});
