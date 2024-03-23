import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { Types } from "mongoose";
import type mongoose from "mongoose";
import { disconnect, connect } from "../../helpers/db";
import { addOrganizationCustomField } from "../../../src/resolvers/Mutation/addOrganizationCustomField";
import { customFieldsByOrganization } from "../../../src/resolvers/Query/customFieldsByOrganization";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";

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

describe("resolvers => Query => customFieldsByOrganization", () => {
  it("should return an array of custom fields for the organization", async () => {
    await addOrganizationCustomField?.(
      {},
      {
        organizationId: testOrganization?._id,
        name: "dataName",
        type: "dataType",
      },
      { userId: testUser?._id },
    );

    const args = {
      id: testOrganization?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    const customFields = await customFieldsByOrganization?.({}, args, context);
    expect(customFields).toBeDefined();
    expect(customFields).toBeInstanceOf(Array);
    expect(customFields?.length).toBeGreaterThan(0);
  });

  it("should throw error if organization does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await addOrganizationCustomField?.(
      {},
      {
        organizationId: testOrganization?._id,
        name: "dataName",
        type: "dataType",
      },
      { userId: testUser?._id },
    );

    const args = {
      id: new Types.ObjectId().toString(),
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await customFieldsByOrganization?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
});
