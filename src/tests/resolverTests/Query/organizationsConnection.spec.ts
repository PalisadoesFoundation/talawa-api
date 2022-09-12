import 'dotenv/config';
import { organizationsConnection as organizationsConnectionResolver } from '../../../lib/resolvers/Query/organizationsConnection';
import {
  Interface_Organization,
  Organization,
  User,
} from '../../../lib/models';
import { connect, disconnect } from '../../../db';
import {
  OrganizationOrderByInput,
  QueryOrganizationsConnectionArgs,
} from '../../../generated/graphQLTypescriptTypes';
import { nanoid } from 'nanoid';
import { Document } from 'mongoose';

let testOrganizations: (Interface_Organization &
  Document<any, any, Interface_Organization>)[];

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  testOrganizations = await Organization.insertMany([
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      isPublic: true,
      creator: testUser._id,
      admins: [testUser._id],
      members: [testUser._id],
      apiUrl: `apiUrl${nanoid()}`,
      visibleInSearch: true,
    },
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      isPublic: false,
      creator: testUser._id,
      admins: [testUser._id],
      members: [testUser._id],
      apiUrl: `apiUrl${nanoid()}`,
      visibleInSearch: false,
    },
    {
      name: `name${nanoid()}`,
      description: `description${nanoid()}`,
      isPublic: true,
      creator: testUser._id,
      admins: [testUser._id],
      members: [testUser._id],
      apiUrl: `apiUrl${nanoid()}`,
      visibleInSearch: true,
    },
  ]);

  await User.updateOne(
    {
      _id: testUser._id,
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
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Query -> organizationsConnection', () => {
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

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id: testOrganizations[1]._id, name: testOrganizations[1].name, 
  description: testOrganizations[1].description, apiUrl: testOrganizations[1].apiUrl,
  visibleInSearch: testOrganizations[1].visibleInSearch, isPublic: testOrganizations[1].isPublic }
  and sorted by ascending order of organization._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const where = {
      _id: testOrganizations[1]._id,
      name: testOrganizations[1].name,
      description: testOrganizations[1].description,
      apiUrl: testOrganizations[1].apiUrl,
      visibleInSearch: testOrganizations[1].visibleInSearch,
      isPublic: testOrganizations[1].isPublic,
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
        isPublic: testOrganizations[1].isPublic,
      },
      orderBy: OrganizationOrderByInput.IdAsc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_not: testOrganizations[0]._id, name_not: testOrganizations[0].name, 
  description_not: testOrganizations[0].description, apiUrl_not: testOrganizations[0].apiUrl } and
  sorted by descending order of organization._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

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
      orderBy: OrganizationOrderByInput.IdDesc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_in: [testOrganizations[1]._id], name_in: [testOrganizations[1].name], 
  description_in: [testOrganizations[1].description], apiUrl_in: [testOrganizations[1].apiUrl] } and
  sorted by ascending order of organization.name if args.orderBy === 'name_ASC'`, async () => {
    const sort = {
      name: 1,
    };

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
        apiUrl_in: [testOrganizations[1].apiUrl!],
      },
      orderBy: OrganizationOrderByInput.NameAsc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { id_not_in: [testOrganizations[0]._id], name_not_in: [testOrganizations[0].name], 
  description_not_in: [testOrganizations[0].description], apiUrl_not_in: [testOrganizations[0].apiUrl] } and
  sorted by descending order of organization.name if args.orderBy === 'name_DESC'`, async () => {
    const sort = {
      name: -1,
    };

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
        apiUrl_not_in: [testOrganizations[0].apiUrl!],
      },
      orderBy: OrganizationOrderByInput.NameDesc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { name_contains: testOrganizations[1].name, description_contains: testOrganizations[1].description,
  apiUrl_contains: testOrganizations[1].apiUrl } and sorted by ascending order of
  organization.description if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const where = {
      name: {
        $regex: testOrganizations[1].name,
        $options: 'i',
      },
      description: {
        $regex: testOrganizations[1].description,
        $options: 'i',
      },
      apiUrl: {
        $regex: testOrganizations[1].apiUrl,
        $options: 'i',
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
      orderBy: OrganizationOrderByInput.DescriptionAsc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations filtered by args.where ===
  { name_starts_with: testOrganizations[1].name, description_starts_with: testOrganizations[1].description,
  apiUrl_starts_with: testOrganizations[1].apiUrl } and sorted by descending order of
  organization.description if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const where = {
      name: new RegExp('^' + testOrganizations[1].name),
      description: new RegExp('^' + testOrganizations[1].description),
      apiUrl: new RegExp('^' + testOrganizations[1].apiUrl),
    };

    const args: QueryOrganizationsConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        name_starts_with: testOrganizations[1].name,
        description_starts_with: testOrganizations[1].description,
        apiUrl_starts_with: testOrganizations[1].apiUrl,
      },
      orderBy: OrganizationOrderByInput.DescriptionDesc,
    };

    const organizations = await Organization.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations sorted by ascending order of
   organization.apiUrl if args.orderBy === 'apiUrl_ASC'`, async () => {
    const sort = {
      apiUrl: 1,
    };

    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      first: 2,
      skip: 1,
      orderBy: OrganizationOrderByInput.ApiUrlAsc,
    };

    const organizations = await Organization.find()
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations sorted by descending order of
   organization.apiUrl if args.orderBy === 'apiUrl_DESC'`, async () => {
    const sort = {
      apiUrl: -1,
    };

    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      first: 2,
      skip: 1,
      orderBy: OrganizationOrderByInput.ApiUrlDesc,
    };

    const organizations = await Organization.find()
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });

  it(`returns paginated list of all existing organizations sorted by descending order of
   organization.apiUrl if args.orderBy === undefined`, async () => {
    const sort = {
      apiUrl: -1,
    };

    const args: QueryOrganizationsConnectionArgs = {
      where: null,
      first: 2,
      skip: 1,
      orderBy: undefined,
    };

    const organizations = await Organization.find()
      .limit(2)
      .skip(1)
      .sort(sort)
      .lean();

    const organizationsConnectionPayload =
      await organizationsConnectionResolver?.({}, args, {});

    expect(organizationsConnectionPayload).toEqual(organizations);
  });
});
