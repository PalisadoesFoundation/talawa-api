import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type mongoose from "mongoose";
import { addOrganizationCustomField } from "../../../src/resolvers/Mutation/addOrganizationCustomField";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";

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
