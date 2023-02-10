import "dotenv/config";
import { organizations as organizationsResolver } from "../../../src/resolvers/Query/organizations";
import { ORGANIZATION_NOT_FOUND } from "../../../src/constants";
import { Organization } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { QueryOrganizationsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUserAndOrganization,
  createTestOrganizationWithAdmin,
} from "../../helpers/userAndOrg";
import { Types } from "mongoose";

let testUser: testUserType;
let testOrganization1: testOrganizationType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization1] = await createTestUserAndOrganization();
  await createTestOrganizationWithAdmin(testUser?._id);
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> organizations", () => {
  it("throws NotFoundError if no organization exists with _id === args.id", async () => {
    try {
      const args: QueryOrganizationsArgs = {
        id: Types.ObjectId().toString(),
      };

      await organizationsResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it("returns organization object with _id === args.id", async () => {
    const args: QueryOrganizationsArgs = {
      id: testOrganization1?._id,
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    expect(organizationsPayload).toEqual([testOrganization1?.toObject()]);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "id_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "id_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.name if args.orderBy === 'name_ASC'`, async () => {
    const sort = {
      name: 1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "name_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.name if args.orderBy === 'name_DESC'`, async () => {
    const sort = {
      name: -1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "name_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.description if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "description_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.description if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "description_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by ascending order of
  organization.apiUrl if args.orderBy === 'apiUrl_ASC'`, async () => {
    const sort = {
      apiUrl: 1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "apiUrl_ASC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.apiUrl if args.orderBy === 'apiUrl_DESC'`, async () => {
    const sort = {
      apiUrl: -1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: "apiUrl_DESC",
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
      .limit(100)
      .lean();

    expect(organizationsPayload).toEqual(organizations);
  });

  it(`returns list of at most 100 organizations sorted by descending order of
  organization.apiUrl if args.orderBy === undefined`, async () => {
    const sort = {
      apiUrl: -1,
    };

    const args: QueryOrganizationsArgs = {
      orderBy: undefined,
    };

    const organizationsPayload = await organizationsResolver?.({}, args, {});

    const organizations = await Organization.find()
      .sort(sort)
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
