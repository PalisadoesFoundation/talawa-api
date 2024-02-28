import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUND_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Fund, Organization } from "../../../src/models";
import { createFund } from "../../../src/resolvers/Mutation/createFund";
import type { MutationCreateFundArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers-> Mutation-> createFund", () => {
  it(" throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationCreateFundArgs = {
        data: {
          organizationId: testOrganization?._id,
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };
      await createFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no organization exists with _id===args.data.organizationId", async () => {
    try {
      const args: MutationCreateFundArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: testUser?._id,
      };

      await createFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if the user is not authorized to create the fund", async () => {
    try {
      const args: MutationCreateFundArgs = {
        data: {
          organizationId: testOrganization?._id,
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const randomUser = await createTestUser();
      const context = {
        userId: randomUser?._id,
      };

      await createFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });
  it("creates fund with provided data", async () => {
    const args: MutationCreateFundArgs = {
      data: {
        organizationId: testOrganization?._id,
        name: "testFund",
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const createdFund = await createFund?.({}, args, context);
    expect(createdFund).toEqual(
      expect.objectContaining({
        name: "testFund",
        organizationId: testOrganization?._id,
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
      }),
    );
    const org = await Organization.findOne({ _id: testOrganization?._id });
    expect(org?.funds).toContainEqual(createdFund?._id);
  });
  it("throw error if the fund already exists", async () => {
    try {
      await Fund.create({
        name: "testFund",
        organizationId: testOrganization?._id,
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
      });
      const args: MutationCreateFundArgs = {
        data: {
          organizationId: testOrganization?._id,
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(FUND_ALREADY_EXISTS.MESSAGE);
    }
  });
});
