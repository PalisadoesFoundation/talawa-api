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
  createTestUser,
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../helpers/userAndOrg";
import { Organization } from "../../src/models";
import { Types } from "mongoose";

let testUser: testUserType;
let testUser2: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  connect();
  const userAndOrg = await createTestUserAndOrganization(false, false);
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
  testUser2 = await createTestUser();
});

afterAll(async () => {
  disconnect();
});

describe("src -> resolvers -> utilities -> creatorCheck.ts", () => {
  afterEach(() => {
    vi.doUnmock("../../src/constants");
    vi.resetModules();
  });

  it("should throw error when user is not creator of organization IN_PRODUCTION = false", async () => {
    await Organization.findByIdAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creator: Types.ObjectId().toString(),
        },
      }
    );

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
      const { creatorCheck: creatorCheckResolver } = await import(
        "../../src/utilities"
      );

      creatorCheckResolver(testUser2?._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
      // expect(error.code).toEqual(USER_NOT_AUTHORIZED_CODE);
      // expect(error.params).toEqual(USER_NOT_AUTHORIZED_PARAM);
    }
  });

  it("should throw error when user is not creator of organization IN_PRODUCTION = true", async () => {
    await Organization.findByIdAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creator: Types.ObjectId().toString(),
        },
      }
    );

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
      const { creatorCheck: creatorCheckResolver } = await import(
        "../../src/utilities"
      );

      creatorCheckResolver(testUser2?._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it("should not throw error when user is creator of organization ", async () => {
    await Organization.findByIdAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creator: testUser?.id,
        },
      }
    );

    const { creatorCheck: creatorCheckResolver } = await import(
      "../../src/utilities"
    );

    expect(creatorCheckResolver(testUser?._id, testOrganization!)).not
      .toThrowError;
  });
});
