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
import { USER_NOT_AUTHORIZED_ADMIN } from "../../src/constants";
import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "../helpers/userAndOrg";
import mongoose from "mongoose";
import { Organization, User } from "../../src/models";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization(false, false);
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> adminCheck", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if userIsOrganizationAdmin === false and isUserSuperAdmin === false", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { adminCheck } = await import("../../src/utilities");
      await adminCheck(testUser!._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`
      );
    }
    expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
  });

  it("throws no error if userIsOrganizationAdmin === false and isUserSuperAdmin === true", async () => {
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: testUser?._id,
      },
      {
        userType: "SUPERADMIN",
      },
      {
        new: true,
        upsert: true,
      }
    );

    const { adminCheck } = await import("../../src/utilities");

    await expect(
      adminCheck(updatedUser!._id, testOrganization!)
    ).resolves.not.toThrowError();
  });

  it("throws no error if user is an admin in that organization but not super admin", async () => {
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: testUser?._id,
      },
      {
        userType: "USER",
      },
      {
        new: true,
        upsert: true,
      }
    );

    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const { adminCheck } = await import("../../src/utilities");

    await expect(
      adminCheck(updatedUser!._id, updatedOrganization!)
    ).resolves.not.toThrowError();
  });
});
