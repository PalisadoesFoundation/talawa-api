import "dotenv/config";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../../src/constants";
import { connect, disconnect } from "../../src/db";
import { AppUserProfile } from "../../src/models";
import { createTestUserFunc } from "../helpers/user";
import type {
  TestAppUserProfileType,
  TestUserType,
} from "../helpers/userAndOrg";

let testUser: TestUserType;
let testAppUserProfile: TestAppUserProfileType;

beforeAll(async () => {
  connect();
  testUser = await createTestUserFunc();
  testAppUserProfile = await AppUserProfile.findOne({ userId: testUser?._id });
});

afterAll(async () => {
  await disconnect();
});

describe("utilities -> superAdminCheck", () => {
  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("throws error if userType===`SUPERADMIN` is false", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { superAdminCheck } = await import("../../src/utilities");
      if (testAppUserProfile) {
        superAdminCheck(testAppUserProfile);
      }
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
    }
  });
});
