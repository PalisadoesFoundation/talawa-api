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
import { USER_NOT_AUTHORIZED_SUPERADMIN } from "../../src/constants";
import { TestUserType } from "../helpers/userAndOrg";
import { createTestUserFunc } from "../helpers/user";

let testUser: TestUserType;

beforeAll(async () => {
  connect();
  testUser = await createTestUserFunc();
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
      superAdminCheck(testUser!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
    }
  });
});
