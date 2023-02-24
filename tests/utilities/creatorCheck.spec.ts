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
import { connect, disconnect } from "../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_AUTHORIZED_MESSAGE } from "../../src/constants";
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
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization(false, false);
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
  testUser2 = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("src -> resolvers -> utilities -> creatorCheck.ts", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("should throw error when user is not creator of organization ", async () => {
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
