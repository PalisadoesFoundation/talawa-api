import mongoose, { Types } from "mongoose";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { addUserCustomData } from "../../../src/resolvers/Mutation/addUserCustomData";
import { removeUserCustomData } from "../../../src/resolvers/Mutation/removeUserCustomData";

import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { connect, disconnect } from "../../helpers/db";

import {
  CUSTOM_DATA_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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

describe("removeUserCustomData mutation", () => {
  it("should successfully remove user custom data associated with the organization", async () => {
    const addedCustomData = await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "testName",
        dataValue: "testValue",
      },
      {
        userId: testUser?._id,
      }
    );

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    const removeCustomData = await removeUserCustomData?.({}, args, context);

    expect(removeCustomData?.organizationId).toBe(
      addedCustomData?.organizationId
    );
    expect(removeCustomData?.userId).toBe(addedCustomData?.userId);
    expect(removeCustomData?.values).toStrictEqual(addedCustomData?.values);
    expect(removeCustomData?._id).toStrictEqual(addedCustomData?._id);
  });

  it("should disallowing removing user custom data when user is not superadmin or admin for the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const nonAdmin = await createTestUser();

    await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "testName",
        dataValue: "testValue",
      },
      {
        userId: testUser?._id,
      }
    );

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: nonAdmin?._id,
    };

    try {
      await removeUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw an error when the user is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "testName",
        dataValue: "testValue",
      },
      {
        userId: testUser?._id,
      }
    );

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: mongoose.Types.ObjectId().toString(),
    };

    try {
      await removeUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw an error when the organization is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "testName",
        dataValue: "testValue",
      },
      {
        userId: testUser?._id,
      }
    );

    const args = {
      organizationId: mongoose.Types.ObjectId().toString(),
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await removeUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it("should throw an error when there is no associated data between the organization and the user", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "",
        dataValue: "",
      },
      {
        userId: testUser?._id,
      }
    );

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await removeUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
  it("should throw error when there is no custom data to remove", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await removeUserCustomData?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(CUSTOM_DATA_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CUSTOM_DATA_NOT_FOUND.MESSAGE}`
      );
    }
  });
});
