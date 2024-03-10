import "dotenv/config";
import { organizations as organizationsResolver } from "../../../src/resolvers/Query/organizations";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization } from "../../../src/models";
import type { QueryOrganizationsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import {
  createTestUserAndOrganization,
  createTestOrganizationWithAdmin,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization1: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization1] = await createTestUserAndOrganization();
  await createTestOrganizationWithAdmin(testUser?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> organizations", () => {
  it("throws NotFoundError if no organization exists with _id === args.id", async () => {
    try {
      const args: QueryOrganizationsArgs = {
        id: new Types.ObjectId().toString(),
      };

      await organizationsResolver?.({}, args, {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.DESC);
    }
  });

  it("returns organization object with _id === args.id", async () => {
    const args: QueryOrganizationsArgs = {
      id: testOrganization1?._id,
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    expect(organizationsPayload).toEqual([testOrganization1?.toObject()]);
  });

  it("returns organization object with _id === args.id from cache", async () => {
    const args: QueryOrganizationsArgs = {
      id: testOrganization1?._id,
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    expect(organizationsPayload).toEqual([testOrganization1?.toObject()]);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization._id if args.orderBy === 'id_ASC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "id_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        _id: 1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization._id if args.orderBy === 'id_DESC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "id_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        _id: -1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.name if args.orderBy === 'name_ASC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "name_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        name: 1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.name if args.orderBy === 'name_DESC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "name_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        name: -1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.description if args.orderBy === 'description_ASC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "description_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        description: 1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.description if args.orderBy === 'description_DESC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "description_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        description: -1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.apiUrl if args.orderBy === 'apiUrl_ASC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "apiUrl_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        apiUrl: 1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.apiUrl if args.orderBy === 'apiUrl_DESC'`, async () => {
    const args: QueryOrganizationsArgs = {
      orderBy: "apiUrl_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort({
        apiUrl: -1,
      })
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations`, async () => {
    const sort = {};

    const args: QueryOrganizationsArgs = {
      orderBy: null,
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });
});
