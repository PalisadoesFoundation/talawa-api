import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { deleteAgendaCategory } from "../../../src/resolvers/Mutation/deleteAgendaCategory";
import { User, AgendaCategoryModel, Organization } from "../../../src/models";
import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import test from "node:test";
import { organizations } from "../../../src/resolvers/Query/organizations";
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAdminUser: TestUserType;
let sampleAgendaCategory: any;
let testOrganization: TestOrganizationType;
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
  });
  sampleAgendaCategory = await AgendaCategoryModel.create({
    name: "Sample Agenda Category",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testUser?._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAgendaCategory", () => {
  it("throws NotFoundError if no user exists with the given ID", async () => {
    try {
      const args = {
        id: sampleAgendaCategory?._id,
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (deleteAgendaCategory) {
        await deleteAgendaCategory({}, args, context);
      } else {
        throw new Error("deleteAgendaCategory resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if the user is not a super admin or the creator of the agenda category", async () => {
    try {
      const args = {
        id: sampleAgendaCategory?._id,
      };
      const context = {
        userId: testUser2?._id,
      };

      if (deleteAgendaCategory) {
        await deleteAgendaCategory({}, args, context);
      } else {
        throw new Error("deleteAgendaCategory resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda category exists with the given ID", async () => {
    try {
      const args = {
        id: Types.ObjectId().toString(),
      };
      const context = {
        userId: testAdminUser?._id,
      };

      if (deleteAgendaCategory) {
        await deleteAgendaCategory({}, args, context);
      } else {
        throw new Error("deleteAgendaCategory resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("deletes an agenda category successfully", async () => {
    const newAgendaCategory = await AgendaCategoryModel.create({
      name: "Test Agenda Category",
      organization: testOrganization?._id,
      createdBy: testUser?._id,
      updatedBy: testUser?._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const args = {
      id: newAgendaCategory._id.toString(),
    };

    const context = {
      userId: testUser?._id,
    };

    if (deleteAgendaCategory) {
      const result = await deleteAgendaCategory({}, args, context);

      expect(result).toEqual(args.id);

      // Verify that the agenda category is deleted from the database
      const deletedAgendaCategory = await AgendaCategoryModel.findById(args.id);
      expect(deletedAgendaCategory).toBeNull();
    } else {
      throw new Error("deleteAgendaCategory resolver is undefined");
    }
  });
});
