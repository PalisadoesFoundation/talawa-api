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
import { USER_NOT_AUTHORIZED_MESSAGE } from "../../src/constants";
import { testUserType } from "../helpers/userAndOrg";
import { createTestUserFunc } from "../helpers/user";

let testUser: testUserType;

beforeAll(async () => {
  connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  disconnect();
});

describe("utilities -> adminCheck", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if userType===`SUPERADMIN` is false and IN_PRODUCTION === true", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { superAdminCheck } = await import("../../src/utilities");
      superAdminCheck(testUser!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });
});
