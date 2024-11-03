import "dotenv/config";
import type mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Organization } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
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

describe("resolvers -> Organization -> image", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`returns absolute url if the image is not null in the organization`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUser?._id,
          image: "/test/image.png",
        },
      },
      {
        new: true,
      },
    );

    const parent = testOrganization?.toObject();

    const { image: imageResolver } = await import(
      "../../../src/resolvers/Organization/image"
    );
    const context = {
      apiRootUrl: "http://testdomain.com",
    };
    if (parent) {
      const creatorPayload = await imageResolver?.(parent, {}, context);
      const org = await Organization.findOne({
        _id: parent._id,
      });
      expect(creatorPayload).toEqual(org?.image);
    }
  });
  it(`returns null if the image is null in the organization`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUser?._id,
          image: null,
        },
      },
      {
        new: true,
      },
    );

    const parent = testOrganization?.toObject();

    const { image: imageResolver } = await import(
      "../../../src/resolvers/Organization/image"
    );
    if (parent) {
      const creatorPayload = await imageResolver?.(parent, {}, {});
      expect(creatorPayload).toEqual(null);
    }
  });
});
