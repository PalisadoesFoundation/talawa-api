import type mongoose from "mongoose";
import { getTimeoutFromJoinedOrganization } from "../../src/utilities/getTimeoutFromJoinedOrganization";
import { connect, disconnect } from "../helpers/db";
import { createTestOrganizationWithAdmin } from "../helpers/userAndOrg";
import type { TestUserType } from "../helpers/user";
import { createTestUserWithUserTypeFunc } from "../helpers/user";
import type { TestOrganizationType } from "../helpers/userAndOrg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testOrganization1: TestOrganizationType;
let testOrganization2: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  // Create a test user and two test organizations with the user as a member
  testUser1 = await createTestUserWithUserTypeFunc("USER");
  testUser2 = await createTestUserWithUserTypeFunc("USER");

  if (testUser1) {
    testOrganization1 = await createTestOrganizationWithAdmin(
      testUser1._id,
      true,
      true,
      true
    );

    testOrganization2 = await createTestOrganizationWithAdmin(
      testUser1._id,
      true,
      false,
      true
    );
  }
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utils -> organizations -> getTimeoutFromJoinedOrganization", () => {
  it("should return an array with timeout information for joined organizations", async () => {
    const result = await getTimeoutFromJoinedOrganization(testUser1?._id);

    expect(result).toEqual([
      {
        _id: testOrganization1 ? testOrganization1._id : null,
        timeout: testOrganization1 ? testOrganization1.timeout : null,
      },
      {
        _id: testOrganization2 ? testOrganization2._id : null,
        timeout: testOrganization2 ? testOrganization2.timeout : null,
      },
    ]);
  });

  it("should return an empty array if the user is not a member of any organizations", async () => {
    const result = await getTimeoutFromJoinedOrganization(testUser2?._id);

    expect(result).toEqual([]);
  });
});
