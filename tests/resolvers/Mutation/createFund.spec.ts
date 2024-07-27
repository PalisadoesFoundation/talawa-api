import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUND_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Fund, Organization } from "../../../src/models";
import { createFund } from "../../../src/resolvers/Mutation/createFund";
import type { MutationCreateFundArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

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
        userId: new Types.ObjectId().toString(),
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
          organizationId: new Types.ObjectId().toString(),
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
        creatorId: testUser?._id,
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
  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
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

    try {
      await createFund?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
