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
import { ApplicationError } from "../../src/libraries/errors";
import type { InterfaceOrganization } from "../../src/models";
import { AppUserProfile, Organization } from "../../src/models";
import { connect, disconnect } from "../helpers/db";
import type { TestOrganizationType, TestUserType } from "../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../helpers/userAndOrg";
import { adminCheck } from "../../src/utilities";
import { requestContext } from "../../src/libraries";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization(false, false);
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> adminCheck", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if userIsOrganizationAdmin === false and isUserSuperAdmin === false", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await adminCheck(
        testUser?._id,
        testOrganization ?? ({} as InterfaceOrganization),
      );
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
    expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
  });

  it("Returns boolean if userIsOrganizationAdmin === false and isUserSuperAdmin === false and throwError is false", async () => {
    expect(
      await adminCheck(
        testUser?._id,
        testOrganization ?? ({} as InterfaceOrganization),
        false,
      ),
    ).toEqual(false);
  });

  it("throws no error if userIsOrganizationAdmin === false and isUserSuperAdmin === true", async () => {
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

    await expect(
      adminCheck(
        updatedUser?.userId?.toString() ?? "",
        testOrganization ?? ({} as InterfaceOrganization),
        false,
      ),
    ).resolves.not.toThrowError();
  });

  it("throws no error if user is an admin in that organization but not super admin", async () => {
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
      },
    );

    await expect(
      adminCheck(
        testUser?._id,
        updatedOrganization ?? ({} as InterfaceOrganization),
      ),
    ).resolves.not.toThrowError();
  });
  it("throws error if user is not found with the specific Id", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await adminCheck(
        new mongoose.Types.ObjectId(),
        testOrganization ?? ({} as InterfaceOrganization),
      );
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
    expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
  });
});
