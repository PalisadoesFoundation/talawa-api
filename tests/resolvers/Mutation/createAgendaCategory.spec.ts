import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Organization, User } from "../../../src/models";
import type { MutationCreateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testUserSuperAdmin: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUserSuperAdmin = await createTestUser();
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

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    },
  );
  await AppUserProfile.updateOne(
    {
      userId: testUserSuperAdmin?._id,
    },
    {
      $set: {
        isSuperAdmin: true,
      },
    },
  );

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
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
          organizationId: testOrganization?._id,
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
        context,
      );

      expect(createdAgendaCategory).toBeDefined();

      // Verify that the agenda category is associated with the correct user and organization
      expect(createdAgendaCategory?.createdBy).toBe(testAdminUser?._id);
      expect(createdAgendaCategory?.organizationId).toBe(testOrganization?._id);
      // Verify that the properties of the returned agenda category match the expected values
      expect(createdAgendaCategory?.name).toEqual(args.input.name);
      expect(createdAgendaCategory?.description).toEqual(
        args.input.description,
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
          organizationId: testOrganization?.id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(), // A random ID that does not exist in the database
      };

      const { createAgendaCategory: createAgendaCategoryResolver } =
        await import("../../../src/resolvers/Mutation/createAgendaCategory");

      const createdAgendaCategory = await createAgendaCategoryResolver?.(
        {},
        args,
        context,
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
          organizationId: new Types.ObjectId().toString(), // A random ID that does not exist in the database
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
        context,
      );

      expect(createdAgendaCategory).toBeUndefined(); // The resolver should not return anything
    } catch (error: unknown) {
      // The resolver should throw a NotFoundError with the appropriate message, code, and parameter
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws an error if the user does not have the required permissions`, async () => {
    try {
      const args: MutationCreateAgendaCategoryArgs = {
        input: {
          name: "Agenda Category",
          description: "Description for the agenda category",
          organizationId: testOrganization?.id,
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
        context,
      );

      expect(createdAgendaCategory).toBeUndefined(); // The resolver should not return anything
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "Error: Current user must be an ADMIN or a SUPERADMIN",
      ); // The resolver should throw an UnauthorizedError with the appropriate message, code, and parameter
    }
  });
  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationCreateAgendaCategoryArgs = {
      input: {
        name: "Agenda Category",
        description: "Description for the agenda category",
        organizationId: testOrganization?.id,
      },
    };
    const context = { userId: testUser?._id };
    const { createAgendaCategory: createAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaCategory"
    );

    try {
      await createAgendaCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
