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
import {
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../src/constants";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  connect();
  const userAndOrg = await createTestUserAndOrganization(false, false);
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  disconnect();
});

describe("utilities -> adminCheck", () => {
  afterEach(() => {
    vi.doUnmock("../../src/constants");
    vi.resetModules();
  });

  it("throws error if userIsOrganizationAdmin === false and IN_PRODUCTION === false", async () => {
    vi.doMock("../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../src/constants"
      );
      return {
        ...actualConstants,
        IN_PRODUCTION: false,
      };
    });

    try {
      const { adminCheck } = await import("../../src/utilities");
      adminCheck(testUser!._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it("throws error if userIsOrganizationAdmin === false and IN_PRODUCTION === true", async () => {
    vi.doMock("../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../src/constants"
      );
      return {
        ...actualConstants,
        IN_PRODUCTION: true,
      };
    });

    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { adminCheck } = await import("../../src/utilities");
      adminCheck(testUser!._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });
});
