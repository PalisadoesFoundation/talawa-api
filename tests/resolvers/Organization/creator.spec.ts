import "dotenv/config";
import { connect, disconnect } from "../../../src/db";
import { User, Organization } from "../../../src/models";
import { Types } from "mongoose";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Organization -> creator", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === parent.creator and IN_PRODUCTION === false`, async () => {
    try {
      testOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      const parent = testOrganization!.toObject();

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { creator: creatorResolver } = await import(
        "../../../src/resolvers/Organization/creator"
      );
      await creatorResolver?.(parent, {}, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === parent.creator and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      testOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      const parent = testOrganization!.toObject();

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { creator: creatorResolver } = await import(
        "../../../src/resolvers/Organization/creator"
      );
      await creatorResolver?.(parent, {}, {});
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`returns user object for parent.creator`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          creator: testUser!._id,
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization!.toObject();

    const { creator: creatorResolver } = await import(
      "../../../src/resolvers/Organization/creator"
    );
    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testOrganization!.creator,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
