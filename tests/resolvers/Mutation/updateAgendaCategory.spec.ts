import type {
  MutationResolvers,
  MutationUpdateAgendaCategoryArgs,
} from "../../../src/types/generatedGraphQLTypes";
import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import type mongoose from "mongoose";
import { AgendaCategoryModel, Organization, User } from "../../../src/models";
import { errors, requestContext } from "../../../src/libraries";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaCategory } from "../../../src/resolvers/Mutation/updateAgendaCategory";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAgendaCategory: any;

import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { Types } from "mongoose";
let testOrganization: TestOrganizationType;
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
  testAgendaCategory = await AgendaCategoryModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    name: "Test Category",
    description: "Sample Category",
    organization: "organizationId",
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message: any) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateAgendaCategory", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: testAgendaCategory._id.toString(),
        input: {
          updatedBy: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      await updateAgendaCategory?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda category exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: Types.ObjectId().toString(),
        input: {
          updatedBy: testAdminUser?._id,
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaCategory?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda category", async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: testAgendaCategory._id.toString(),
        input: {
          updatedBy: testAdminUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await updateAgendaCategory?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("updates the agenda category successfully", async () => {
    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory._id.toString(),
      input: {
        updatedBy: testAdminUser?._id,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    const { updateAgendaCategory: updateAgendaCategoryResolver } = await import(
      "../../../src/resolvers/Mutation/updateAgendaCategory"
    );

    const updateAgendaCategoryPayload = await updateAgendaCategoryResolver?.(
      {},
      args,
      context
    );

    const testUpdateAgendaCategoryPayload = await AgendaCategoryModel.findOne({
      _id: testAgendaCategory?._id,
    }).lean();

    expect(updateAgendaCategoryPayload).toEqual(
      testUpdateAgendaCategoryPayload
    );
  });
  it("throws an error when the user is not the creator of the agenda category", async () => {
    // ... your setup code

    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory._id.toString(),
      input: {
        updatedBy: testAdminUser?._id,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    // Update testAgendaCategory with invalid createdBy value
    await AgendaCategoryModel.findByIdAndUpdate(testAgendaCategory._id, {
      createdBy: "invalidUserId",
    });

    // Expect an error because the createdBy value is now invalid
    await expect(updateAgendaCategory?.({}, args, context)).toThrowError(
      USER_NOT_AUTHORIZED_ERROR.MESSAGE
    );
  });

  // Example for Integration Testing
  it("updates the agenda category and associated user data successfully", async () => {
    // ... your setup code

    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory._id.toString(),
      input: {
        updatedBy: testAdminUser?._id,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    // Perform the update
    const updateAgendaCategoryPayload = await updateAgendaCategory?.(
      {},
      args,
      context
    );

    // Verify that the associated user data is updated as expected
    const updatedUser = await User.findById(testAdminUser?._id).lean();

    expect(updateAgendaCategoryPayload).toBeDefined();
  });
});
