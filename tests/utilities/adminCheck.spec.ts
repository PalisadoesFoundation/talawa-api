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
  testOrganizationType,
  testUserType,
} from "../helpers/userAndOrg";
import mongoose from "mongoose";
import { Organization, User } from "../../src/models";

let testUser: testUserType;
let testOrganization: testOrganizationType;
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
      adminCheck(testUser!._id, testOrganization!);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.message}`
      );

      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.message);
    }
  });

  it("throws no error if userIsOrganizationAdmin === false and isUserSuperAdmin === true", async () => {
    const updatedUser = await User.findByIdAndUpdate(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          userType: "SUPERADMIN",
        },
      },
      {
        new: true,
      }
    );

    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    console.log(updatedUser);

    const { adminCheck } = await import("../../src/utilities");
    adminCheck(updatedUser!._id, testOrganization!);

    expect(spy).not.toBeCalled();
  });

  it("throws no error if user is an admin in that organization but not super admin", async () => {
    const updatedUser = await User.findByIdAndUpdate(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          userType: "USER",
        },
      },
      {
        new: true,
      }
    );

    const updatedOrganization = await Organization.findByIdAndUpdate(
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
      }
    );

    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const { adminCheck } = await import("../../src/utilities");
    adminCheck(updatedUser!._id, updatedOrganization!);

    expect(spy).not.toBeCalled();
  });
});
