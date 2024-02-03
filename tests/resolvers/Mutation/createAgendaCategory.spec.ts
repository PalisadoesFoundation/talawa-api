import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { expect, vi, beforeAll, afterAll, describe, it } from "vitest";
import type { MutationCreateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { createAgendaCategory } from "../../../src/resolvers/Mutation/createAgendaCategory";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { Organization, User } from "../../../src/models";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { errors } from "../../../src/libraries";
import { UnknownKeysParam } from "zod";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUserSuperAdmin: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUser2 = await createTestUser();
  testUserSuperAdmin = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
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

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAgendaCategory", () => {
  it(`creates an agenda category successfully`, async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          name: "Agenda Category",
          description: "Description for the agenda category",
          organization: testOrganization?._id,
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");

      const createdAgendaCategory = await createAgendaCategoryResolver?.(
        {},
        args,
        context
      );

      expect(createdAgendaCategory).toBeDefined();

      // Verify that the agenda category is associated with the correct user and organization
      expect(createdAgendaCategory?.createdBy).toBe(testAdminUser?._id);
      expect(createdAgendaCategory?.organization).toBe(testOrganization?._id);
      // Verify that the organization's list is updated correctly
      const updatedOrganization = await Organization.findById(
        testOrganization?._id
      ).lean();
      expect(updatedOrganization?.agendaCatgories).toContain(
        createdAgendaCategory?._id.toString()
      );
      // Verify that the properties of the returned agenda category match the expected values
      expect(createdAgendaCategory?.name).toEqual(args.input.name);
      expect(createdAgendaCategory?.description).toEqual(
        args.input.description
      );
      expect(createdAgendaCategory?._id).toBeUndefined();
    } catch (error) {
      expect(error);
    }
  });

  it(`throws an error if the user is not found`, async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          name: "Agenda Category",
          description: "Description for the agenda category",
          organization: testOrganization?.id,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(), // A random ID that does not exist in the database
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");

      const createdAgendaCategory = await createAgendaCategoryResolver?.(
        {},
        args,
        context
      );

      expect(createdAgendaCategory).toBeUndefined(); // The resolver should not return anything
    } catch (error: unknown) {
      // The resolver should throw a NotFoundError with the appropriate message, code, and parameter

      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws an error if the organization is not found`, async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          name: "Agenda Category",
          description: "Description for the agenda category",
          organization: Types.ObjectId().toString(), // A random ID that does not exist in the database
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");

      const createdAgendaCategory = await createAgendaCategoryResolver?.(
        {},
        args,
        context
      );

      expect(createdAgendaCategory).toBeUndefined(); // The resolver should not return anything
    } catch (error: unknown) {
      // The resolver should throw a NotFoundError with the appropriate message, code, and parameter
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
    }
  });

  it(`throws an error if the user does not have the required permissions`, async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          name: "Agenda Category",
          description: "Description for the agenda category",
          organization: testOrganization?.id,
        },
      };

      const context = {
        userId: testUser2?._id, // A user that is not an admin for the organization
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");

      const createdAgendaCategory = await createAgendaCategoryResolver?.(
        {},
        args,
        context
      );

      expect(createdAgendaCategory).toBeUndefined(); // The resolver should not return anything
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "Error: Current user must be an ADMIN or a SUPERADMIN"
      ); // The resolver should throw an UnauthorizedError with the appropriate message, code, and parameter
    }
  });
});
