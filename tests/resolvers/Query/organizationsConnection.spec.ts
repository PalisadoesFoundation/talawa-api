import "dotenv/config";
import { organizationsConnection as organizationsConnectionResolver } from "../../../src/resolvers/Query/organizationsConnection";
import type { InterfaceOrganization } from "../../../src/models";
import { Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import type { QueryOrganizationsConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { nanoid } from "nanoid";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganizations: (InterfaceOrganization &
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Document<any, any, InterfaceOrganization>)[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const testUser: TestUserType = await createTestUser();

  testOrganizations = await Organization.insertMany([
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      creatorId: testUser?._id,
      admins: [testUser?._id],
      members: [testUser?._id],
      userRegistrationRequired: true,
      visibleInSearch: true,
      apiUrl: `apiUrl${nanoid()}`,
    },
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      creatorId: testUser?._id,
      admins: [testUser?._id],
      userRegistrationRequired: false,
      visibleInSearch: false,
      members: [testUser?._id],
      apiUrl: `apiUrl${nanoid()}`,
    },
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      creatorId: testUser?._id,
      admins: [testUser?._id],
      userRegistrationRequired: true,
      visibleInSearch: true,
      members: [testUser?._id],
      apiUrl: `apiUrl${nanoid()}`,
    },
  ]);

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $set: {
        createdOrganizations: [
          testOrganizations[0]._id,
          testOrganizations[1]._id,
          testOrganizations[2]._id,
        ],
        adminFor: [
          testOrganizations[0]._id,
          testOrganizations[1]._id,
          testOrganizations[2]._id,
        ],
        joinedOrganizations: [
          testOrganizations[0]._id,
          testOrganizations[1]._id,
          testOrganizations[2]._id,
        ],
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> organizationsConnection", () => {
  it(`returns paginated list of all existing organizations without any filtering and sorting'`, async () => {
    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      orderBy: null,
      first: 2,
      skip: 1,
    };

    const organizations = await Organization.find().limit(2).skip(1).lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });
  it(`returns paginated list of all existing organizations without any filtering and sorting with first = 0 and skip = 0 if not provided'`, async () => {
    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      orderBy: null,
    };

    const organizations = await Organization.find().limit(0).skip(0).lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id: testOrganizations[1]._id, name: testOrganizations[1].name, 
  description: testOrganizations[1].description, apiUrl: testOrganizations[1].apiUrl,
  visibleInSearch: testOrganizations[1].visibleInSearch, userRegistrationRequired: testOrganizations[1].userRegistrationRequired }
  and sorted by ascending order of organization._id if args.orderBy === 'id_ASC'`, async () => {
    const where = {
      _id: testOrganizations[1]._id,
      name: testOrganizations[1].name,
      description: testOrganizations[1].description,
      apiUrl: testOrganizations[1].apiUrl,
      visibleInSearch: testOrganizations[1].visibleInSearch,
      userRegistrationRequired: testOrganizations[1].userRegistrationRequired,
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id: testOrganizations[1].id,
        name: testOrganizations[1].name,
        description: testOrganizations[1].description,
        apiUrl: testOrganizations[1].apiUrl,
        visibleInSearch: testOrganizations[1].visibleInSearch,
        userRegistrationRequired: testOrganizations[1].userRegistrationRequired,
      },
      orderBy: "id_ASC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        _id: 1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_not: testOrganizations[0]._id, name_not: testOrganizations[0].name, 
  description_not: testOrganizations[0].description, apiUrl_not: testOrganizations[0].apiUrl } and
  sorted by descending order of organization._id if args.orderBy === 'id_DESC'`, async () => {
    const where = {
      _id: {
        $ne: testOrganizations[0]._id,
      },
      name: {
        $ne: testOrganizations[0].name,
      },
      description: {
        $ne: testOrganizations[0].description,
      },
      apiUrl: {
        $ne: testOrganizations[0].apiUrl,
      },
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_not: testOrganizations[0].id,
        name_not: testOrganizations[0].name,
        description_not: testOrganizations[0].description,
        apiUrl_not: testOrganizations[0].apiUrl,
      },
      orderBy: "id_DESC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        _id: -1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_in: [testOrganizations[1]._id], name_in: [testOrganizations[1].name], 
  description_in: [testOrganizations[1].description], apiUrl_in: [testOrganizations[1].apiUrl] } and
  sorted by ascending order of organization.name if args.orderBy === 'name_ASC'`, async () => {
    const where = {
      _id: {
        $in: [testOrganizations[1]._id],
      },
      name: {
        $in: [testOrganizations[1].name],
      },
      description: {
        $in: [testOrganizations[1].description],
      },
      apiUrl: {
        $in: [testOrganizations[1].apiUrl],
      },
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_in: [testOrganizations[1]._id],
        name_in: [testOrganizations[1].name],
        description_in: [testOrganizations[1].description],
        apiUrl_in: [testOrganizations[1].apiUrl ?? ""],
      },
      orderBy: "name_ASC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        name: 1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_not_in: [testOrganizations[0]._id], name_not_in: [testOrganizations[0].name], 
  description_not_in: [testOrganizations[0].description], apiUrl_not_in: [testOrganizations[0].apiUrl] } and
  sorted by descending order of organization.name if args.orderBy === 'name_DESC'`, async () => {
    const where = {
      _id: {
        $nin: [testOrganizations[0]._id],
      },
      name: {
        $nin: [testOrganizations[0].name],
      },
      description: {
        $nin: [testOrganizations[0].description],
      },
      apiUrl: {
        $nin: [testOrganizations[0].apiUrl],
      },
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_not_in: [testOrganizations[0]._id],
        name_not_in: [testOrganizations[0].name],
        description_not_in: [testOrganizations[0].description],
        apiUrl_not_in: [testOrganizations[0].apiUrl ?? ""],
      },
      orderBy: "name_DESC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        name: -1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { name_contains: testOrganizations[1].name, description_contains: testOrganizations[1].description,
  apiUrl_contains: testOrganizations[1].apiUrl } and sorted by ascending order of
  organization.description if args.orderBy === 'description_ASC'`, async () => {
    const where = {
      name: {
        $regex: testOrganizations[1].name,
        $options: "i",
      },
      description: {
        $regex: testOrganizations[1].description,
        $options: "i",
      },
      apiUrl: {
        $regex: testOrganizations[1].apiUrl,
        $options: "i",
      },
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        name_contains: testOrganizations[1].name,
        description_contains: testOrganizations[1].description,
        apiUrl_contains: testOrganizations[1].apiUrl,
      },
      orderBy: "description_ASC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        description: 1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { name_starts_with: testOrganizations[1].name, description_starts_with: testOrganizations[1].description,
  apiUrl_starts_with: testOrganizations[1].apiUrl } and sorted by descending order of
  organization.description if args.orderBy === 'description_DESC'`, async () => {
    const where = {
      name: new RegExp("^" + testOrganizations[1].name),
      description: new RegExp("^" + testOrganizations[1].description),
      apiUrl: new RegExp("^" + testOrganizations[1].apiUrl),
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        name_starts_with: testOrganizations[1].name,
        description_starts_with: testOrganizations[1].description,
        apiUrl_starts_with: testOrganizations[1].apiUrl,
      },
      orderBy: "description_DESC",
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort({
        description: -1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations sorted by ascending order of
   organization.apiUrl if args.orderBy === 'apiUrl_ASC'`, async () => {
    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      first: 2,
      skip: 1,
      orderBy: "apiUrl_ASC",
    };

    const organizations = await Organization.find()
      .limit(2)
      .skip(1)
      .sort({
        apiUrl: 1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations sorted by descending order of
   organization.apiUrl if args.orderBy === 'apiUrl_DESC'`, async () => {
    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      first: 2,
      skip: 1,
      orderBy: "apiUrl_DESC",
    };

    const organizations = await Organization.find()
      .limit(2)
      .skip(1)
      .sort({
        apiUrl: -1,
      })
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });
});
