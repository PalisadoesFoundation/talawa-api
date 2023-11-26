import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type mongoose from "mongoose";
import { removeOrganizationCustomField } from "../../../src/resolvers/Mutation/removeOrganizationCustomField";
import { addOrganizationCustomField } from "../../../src/resolvers/Mutation/addOrganizationCustomField";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import { connect, disconnect } from "../../helpers/db";

import {
  CUSTOM_FIELD_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { OrganizationCustomField } from "../../../src/models";

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

describe("resolvers => Mutation => removeOrganizationCustomField", () => {
  it("should remove field added by the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const customField = await addOrganizationCustomField?.(
      {},
      {
        organizationId: testOrganization?._id,
        name: "testName",
        type: "testType",
      },
      {
        userId: testUser?._id,
      }
    );

    const initialCustomFields = await OrganizationCustomField.find({
      organizationId: testOrganization?._id,
    });

    expect(customField).toBeDefined();
    expect(customField?.organizationId.toString()).toBe(
      testOrganization?._id.toString()
    );

    const context = { userId: testUser?._id };
    const args = {
      organizationId: testOrganization?._id as string,
      customFieldId: customField?._id.toString() as string,
    };
    await removeOrganizationCustomField?.({}, args, context);

    const updatedCustomFields = await OrganizationCustomField.find({
      organizationId: testOrganization?._id,
    });

    expect(updatedCustomFields).toHaveLength(initialCustomFields.length - 1);
    const removedCustomField = updatedCustomFields.find(
      (field) => field._id.toString() === customField?._id.toString()
    );
    expect(removedCustomField).toBeUndefined();
  });

  it("should fail attempting to remove field", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const nonExistentCustomFieldId = Types.ObjectId().toString();

    const context = { userId: testUser?._id };
    const args = {
      organizationId: testOrganization?._id as string,
      customFieldId: nonExistentCustomFieldId as string,
    };

    try {
      await removeOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(CUSTOM_FIELD_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CUSTOM_FIELD_NOT_FOUND.MESSAGE}`
      );
    }
  });

  it("should throw an error when user is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const customField = await addOrganizationCustomField?.(
      {},
      {
        organizationId: testOrganization?._id,
        name: "testName",
        type: "testType",
      },
      {
        userId: testUser?._id,
      }
    );

    expect(customField).toBeDefined();
    expect(customField?.organizationId.toString()).toBe(
      testOrganization?._id.toString()
    );

    const context = { userId: Types.ObjectId().toString() };
    const args = {
      organizationId: testOrganization?._id as string,
      customFieldId: customField?._id.toString() as string,
    };

    try {
      await removeOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw an error when organization is not found", async () => {
    const customField = await addOrganizationCustomField?.(
      {},
      {
        organizationId: testOrganization?._id,
        name: "testName",
        type: "testType",
      },
      {
        userId: testUser?._id,
      }
    );

    expect(customField).toBeDefined();
    expect(customField?.organizationId.toString()).toBe(
      testOrganization?._id.toString()
    );

    const context = { userId: testUser?._id };
    const args = {
      organizationId: Types.ObjectId().toString() as string,
      customFieldId: customField?._id.toString() as string,
    };

    try {
      await removeOrganizationCustomField?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
});
