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
import { connect, disconnect } from "../../src/db";
import { USER_NOT_AUTHORIZED_ADMIN } from "../../src/constants";
import type { TestUserType } from "../helpers/userAndOrg";
import { createTestUserFunc } from "../helpers/user";

let testUser: TestUserType;

beforeAll(async () => {
  connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
});

describe("utilities -> isAuthCheck", () => {
  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("throws error if userType === `SUPERADMIN` or userType === `ADMIN` is false", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { isAuthCheck } = await import("../../src/utilities");
      if (testUser) {
        testUser.userType = "USER";
        isAuthCheck(testUser);
      }
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });
});
