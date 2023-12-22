import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [testUser, testOrganization] = await createTestUserAndOrganization();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> updatedBy", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === parent.updatedBy`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      testOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            updatedBy: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      const parent = testOrganization?.toObject();

      const { updatedBy: updatedByResolver } = await import(
        "../../../src/resolvers/Organization/updatedBy"
      );
      if (parent) {
        await updatedByResolver?.(parent, {}, {});
      }
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`returns user object for parent.updatedBy`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          updatedBy: testUser?._id,
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization?.toObject();

    const { updatedBy: updatedByResolver } = await import(
      "../../../src/resolvers/Organization/updatedBy"
    );
    if (parent) {
      const updatedByPayload = await updatedByResolver?.(parent, {}, {});
      const updator = await User.findOne({
        _id: testOrganization?.updatedBy,
      }).lean();

      expect(updatedByPayload).toEqual(updator);
    }
  });
});
