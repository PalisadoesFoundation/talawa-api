import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type mongoose from "mongoose";
import { addOrganizationCustomField } from "../../../src/resolvers/Mutation/addOrganizationCustomField";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import { connect, disconnect } from "../../helpers/db";

import {
  CUSTOM_FIELD_NAME_MISSING,
  CUSTOM_FIELD_TYPE_MISSING,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";
import type { TransactionLog } from "../../../src/types/generatedGraphQLTypes";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestUserAndOrganization();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers => Mutation => addOrganizationCustomField", () => {
  it("should add a new custom field to the organization", async () => {
    const args = {
      organizationId: testOrganization?._id,
      name: "testName",
      type: "testType",
    };
    const context = { userId: testUser?._id };

    const newCustomField = await addOrganizationCustomField?.(
      {},
      args,
      context
    );

    expect(newCustomField?.name).toBe("testName");
    expect(newCustomField?.type).toBe("testType");
    expect(newCustomField?.organizationId.toString()).toBe(
      testOrganization?._id.toString()
    );

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "Organization",
    });

    expect((mostRecentTransactions as TransactionLog[])[1]).toMatchObject({
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "OrganizationCustomField",
    });
  });

  it("should throw error when user attempting to add custom field is not an admin", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const nonAdmin = await createTestUser();

    const args = {
      organizationId: testOrganization?._id,
      name: "testName",
      type: "testType",
    };

    const context = { userId: nonAdmin?._id };

    try {
      await addOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw error when customfield name is missing", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: testOrganization?._id,
      name: "",
      type: "testType",
    };
    const context = { userId: testUser?._id };

    try {
      await addOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(CUSTOM_FIELD_NAME_MISSING.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CUSTOM_FIELD_NAME_MISSING.MESSAGE}`
      );
    }
  });

  it("should throw error when customfield type is missing", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: testOrganization?._id,
      name: "fieldName",
      type: "",
    };
    const context = { userId: testUser?._id };

    try {
      await addOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(CUSTOM_FIELD_TYPE_MISSING.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CUSTOM_FIELD_TYPE_MISSING.MESSAGE}`
      );
    }
  });

  it("should throw an error if user is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const unknownUser = {
      _id: Types.ObjectId().toString(),
    };

    const args = {
      organizationId: testOrganization?._id,
      name: "testName",
      type: "testType",
    };
    const context = { userId: unknownUser?._id };

    try {
      await addOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
  it("should throw an error if organization is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: Types.ObjectId().toString(),
      name: "testName",
      type: "testType",
    };
    const context = { userId: testUser?._id };

    try {
      await addOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
});
