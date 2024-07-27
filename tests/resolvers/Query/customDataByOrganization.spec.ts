import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { customDataByOrganization } from "../../../src/resolvers/Query/customDataByOrganization";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { connect, disconnect } from "../../helpers/db";
import { addUserCustomData } from "../../../src/resolvers/Mutation/addUserCustomData";

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

describe("resolvers => Query => customDataByOrganization", () => {
  it("should return array containing the customData for organization", async () => {
    await addUserCustomData?.(
      {},
      {
        organizationId: testOrganization?._id,
        dataName: "testDataName",
        dataValue: "testDataValue",
      },
      { userId: testUser?._id },
    );

    const args = {
      organizationId: testOrganization?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    const customDatas = await customDataByOrganization?.({}, args, context);

    expect(customDatas).toBeDefined();
    expect(customDatas).toBeInstanceOf(Array);
    expect(customDatas?.length).toBeGreaterThan(0);
  });
});
