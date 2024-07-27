import "dotenv/config";
import mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { USER_NOT_AUTHORIZED_ADMIN } from "../../src/constants";
import { AppUserProfile } from "../../src/models";
import type { InterfaceUserFamily } from "../../src/models/userFamily";
import { UserFamily } from "../../src/models/userFamily";
import { connect, disconnect } from "../helpers/db";
import { createTestUserFunc } from "../helpers/user";
import type {
  TestUserFamilyType,
  TestUserType,
} from "../helpers/userAndUserFamily";
import { createTestUserAndUserFamily } from "../helpers/userAndUserFamily";

let testUser: TestUserType;
let testUserFamily: TestUserFamilyType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndUserFamily = await createTestUserAndUserFamily(false, false);
  testUser = await createTestUserFunc();
  testUserFamily = userAndUserFamily[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> userFamilyAdminCheck", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if userIsUserFamilyAdmin === false and isUserSuperAdmin === false", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { adminCheck } = await import(
        "../../src/utilities/userFamilyAdminCheck"
      );
      await adminCheck(
        testUser?._id,
        testUserFamily ?? ({} as InterfaceUserFamily),
      );
    } catch (error) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
    expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
  });

  it("throws no error if userIsUserFamilyAdmin === false and isUserSuperAdmin === true", async () => {
    const updatedUser = await AppUserProfile.findOneAndUpdate(
      {
        userId: testUser?._id,
      },
      {
        isSuperAdmin: true,
      },
      {
        new: true,
        upsert: true,
      },
    );

    const { adminCheck } = await import(
      "../../src/utilities/userFamilyAdminCheck"
    );

    await expect(
      adminCheck(
        updatedUser?.userId?.toString() ?? "",
        testUserFamily ?? ({} as InterfaceUserFamily),
      ),
    ).resolves.not.toThrowError();
  });

  it("throws no error if user is an admin in that user family but not super admin", async () => {
    const updatedUserFamily = await UserFamily.findOneAndUpdate(
      {
        _id: testUserFamily?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    const { adminCheck } = await import(
      "../../src/utilities/userFamilyAdminCheck"
    );

    await expect(
      adminCheck(
        testUser?._id,
        updatedUserFamily ?? ({} as InterfaceUserFamily),
      ),
    ).resolves.not.toThrowError();
  });
  it("throws error if user is not found with the specific Id", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { adminCheck } = await import(
        "../../src/utilities/userFamilyAdminCheck"
      );
      await adminCheck(
        new mongoose.Types.ObjectId(),
        testUserFamily ?? ({} as InterfaceUserFamily),
      );
    } catch (error) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
    expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
  });
});
