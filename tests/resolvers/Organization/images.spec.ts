import "dotenv/config";
import mongoose, { Types } from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  BASE_URL,
  ORGANIZATION_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { Organization } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Organization -> image", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === parent.creator and IN_PRODUCTION === false`, async () => {
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

      const { image: imageResolver } = await import(
        "../../../src/resolvers/Organization/image"
      );
      await imageResolver?.(parent, {}, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === parent.creator and IN_PRODUCTION === true`, async () => {
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

      const { image: imageResolver } = await import(
        "../../../src/resolvers/Organization/image"
      );
      await imageResolver?.(parent, {}, {});
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_MESSAGE}`
      );
    }
  });

  it(`returns absolute url if the image is not null in the organization`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          creator: testUser!._id,
          image: "/test/image.png",
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization!.toObject();

    const { image: imageResolver } = await import(
      "../../../src/resolvers/Organization/image"
    );
    const creatorPayload = await imageResolver?.(parent, {}, {});

    const org = await Organization.findOne({
      _id: parent._id,
    });

    expect(creatorPayload).toEqual(BASE_URL + org?.image);
  });

  it(`returns null if the image is null in the organization`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          creator: testUser!._id,
          image: null,
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization!.toObject();

    const { image: imageResolver } = await import(
      "../../../src/resolvers/Organization/image"
    );
    const creatorPayload = await imageResolver?.(parent, {}, {});
    expect(creatorPayload).toEqual(null);
  });
});
