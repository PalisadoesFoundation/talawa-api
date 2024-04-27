import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUND_ALREADY_EXISTS,
  FUND_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Fund } from "../../../src/models";
import { updateFund } from "../../../src/resolvers/Mutation/updateFund";
import type { TestFundType } from "../../helpers/Fund";
import { createTestFund } from "../../helpers/Fund";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;

let testFund: TestFundType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const temp = await createTestFund();
  testUser = temp[0];

  testFund = temp[2];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers-> Mutation-> updateFund", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args = {
        id: testFund?._id,
        data: {
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund exists with _id===args.id", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
        data: {
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      console.log((error as Error).message);
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no organization exists with _id===fund.organizationId", async () => {
    try {
      const fund = await Fund.create({
        organizationId: new Types.ObjectId(),
        name: `name${nanoid().toLowerCase()}`,
        refrenceNumber: `refrenceNumber${nanoid().toLowerCase()}`,
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
        creatorId: testUser?._id,
        campaign: [],
      });
      const args = {
        id: fund?._id.toString(),
        data: {
          name: "testFund",
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if the user is not authorized to update the fund", async () => {
    try {
      const args = {
        id: testFund?._id,
        data: {
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

      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });
  it("update the fund with the provided data", async () => {
    const args = {
      id: testFund?._id,
      data: {
        name: "testFund",
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const updatedFund = await updateFund?.({}, args, context);
    expect(updatedFund?.name).toEqual(args.data.name);
  });
  it("throw error if the fund already exists with the same name", async () => {
    try {
      const fund = await Fund.create({
        organizationId: testFund?.organizationId,
        name: `name${nanoid().toLowerCase()}`,
        refrenceNumber: `refrenceNumber${nanoid().toLowerCase()}`,
        taxDeductible: true,
        isDefault: true,
        isArchived: false,
        creatorId: testUser?._id,
        campaign: [],
      });
      const args = {
        id: testFund?._id,
        data: {
          name: fund?.name,
          taxDeductible: true,
          isDefault: true,
          isArchived: false,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(FUND_ALREADY_EXISTS.MESSAGE);
    }
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args = {
      id: testFund?._id,
      data: {
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
      await updateFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
