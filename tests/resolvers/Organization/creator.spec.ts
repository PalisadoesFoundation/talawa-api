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
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> creatorId", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === parent.creatorId`, async () => {
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
            creatorId: new Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
      );

      const parent = testOrganization?.toObject();

      const { creator: creatorResolver } = await import(
        "../../../src/resolvers/Organization/creator"
      );
      if (parent) {
        await creatorResolver?.(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`returns user object for parent.creatorId`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUser?._id,
        },
      },
      {
        new: true,
      },
    );

    const parent = testOrganization?.toObject();

    const { creator: creatorResolver } = await import(
      "../../../src/resolvers/Organization/creator"
    );
    if (parent) {
      const creatorPayload = await creatorResolver?.(parent, {}, {});
      const creator = await User.findOne({
        _id: testOrganization?.creatorId,
      }).lean();

      expect(creatorPayload).toEqual(creator);
    }
  });
});
