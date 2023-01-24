import "dotenv/config";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
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
  Interface_Organization,
  Interface_User,
  Organization,
  User,
} from "../../src/models";
import {
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
} from "../../src/constants";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
const testUserEmail: string = `email${nanoid().toLowerCase()}@gmail.com`;

beforeAll(async () => {
  connect();

  testUser = await User.create({
    email: testUserEmail,
    password: "testPassword",
    firstName: "testFirstName",
    lastName: "testLastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "testName",
    description: "testDescription",
    isPublic: true,
    creator: testUser._id,
    admins: [],
    members: [testUser._id],
  });
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
      adminCheck(testUser._id, testOrganization);
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
      adminCheck(testUser._id, testOrganization);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });
});
