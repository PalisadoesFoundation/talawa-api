import "dotenv/config";
import { organizationsMemberConnection as organizationsMemberConnectionResolver } from "../../../src/resolvers/Query/organizationsMemberConnection";
import {
  Interface_Organization,
  Interface_User,
  Organization,
  User,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { QueryOrganizationsMemberConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { Document, Types } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: `1firstName${nanoid()}`,
      lastName: `lastName${nanoid()}`,
      appLanguageCode: `en${nanoid().toLowerCase()}`,
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: `2firstName${nanoid()}`,
      lastName: `lastName${nanoid()}`,
      appLanguageCode: `en${nanoid().toLowerCase()}`,
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: `3firstName${nanoid()}`,
      lastName: `lastName${nanoid()}`,
      appLanguageCode: `en${nanoid().toLowerCase()}`,
    },
  ]);

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id, testUsers[1]._id, testUsers[2]._id],
    members: [testUsers[0]._id, testUsers[1]._id, testUsers[2]._id],
    apiUrl: "apiUrl",
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  await User.updateOne(
    {
      _id: testUsers[1].id,
    },
    {
      $push: {
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  await User.updateOne(
    {
      _id: testUsers[2]._id,
    },
    {
      $push: {
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> organizationsMemberConnection", () => {
  it(`when no organization exists with _id === args.orgId`, async () => {
    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: Types.ObjectId().toString(),
      first: 1,
      skip: 1,
      where: null,
      orderBy: null,
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: [],
      aggregate: {
        count: 0,
      },
    });
  });

  // it(`returns paginated list of users filtered by
  //   args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
  //   lastName: testUsers[1].lastName, email: testUsers[1].email,
  //   appLanguageCode: testUsers[1].appLanguageCode } and sorted by
  //   args.orderBy === 'id_ASC'`, async () => {
  //   const where = {
  //     _id: testUsers[1].id,
  //     firstName: testUsers[1].firstName,
  //     lastName: testUsers[1].lastName,
  //     email: testUsers[1].email,
  //     appLanguageCode: testUsers[1].appLanguageCode,
  //   };

  //   const sort = {
  //     _id: 1,
  //   };

  //   const args: QueryOrganizationsMemberConnectionArgs = {
  //     orgId: testOrganization.id,
  //     first: 1,
  //     skip: 1,
  //     where: {
  //       id: testUsers[1].id,
  //       firstName: testUsers[1].firstName,
  //       lastName: testUsers[1].lastName,
  //       email: testUsers[1].email,
  //       appLanguageCode: testUsers[1].appLanguageCode,
  //     },
  //     orderBy: "id_ASC",
  //   };

  // const organizationsMemberConnectionPayload =
  //   await organizationsMemberConnectionResolver?.({}, args, {});

  // const users = await User.find(where)
  //   // .limit(1)
  //   // .skip(1)
  //   .sort(sort)
  //   .select(['-password'])
  //   .lean();

  // expect(organizationsMemberConnectionPayload).toEqual({
  //   pageInfo: {
  //     hasNextPage: false,
  //     hasPreviousPage: false,
  //     totalPages: 1,
  //     nextPageNo: null,
  //     prevPageNo: null,
  //     currPageNo: 1,
  //   },
  //   edges: users,
  //   aggregate: {
  //     count: 1,
  //   },
  // });

  //   it(`returns paginated list of users filtered by
  //   args.where === { id_not: testUsers[2]._id, firstName_not: testUsers[2].firstName,
  //   lastName_not: testUsers[2].lastName, email_not: testUsers[2].email,
  //   appLanguageCode_not: testUsers[2].appLanguageCode } and
  //   sorted by args.orderBy === 'id_Desc'`, async () => {
  //     const where = {
  //       _id: {
  //         $ne: testUsers[2]._id,
  //       },
  //       firstName: {
  //         $ne: testUsers[2].firstName,
  //       },
  //       lastName: {
  //         $ne: testUsers[2].lastName,
  //       },
  //       email: {
  //         $ne: testUsers[2].email,
  //       },
  //       appLanguageCode: {
  //         $ne: testUsers[2].appLanguageCode,
  //       },
  //     };
  //     const sort = {
  //       _id: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: {
  //         id_not: testUsers[2]._id,
  //         firstName_not: testUsers[2].firstName,
  //         lastName_not: testUsers[2].lastName,
  //         email_not: testUsers[2].email,
  //         appLanguageCode_not: testUsers[2].appLanguageCode,
  //       },
  //       orderBy: "id_DESC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users filtered by
  //   args.where === { id_in: [testUsers[1].id], firstName_in: [testUsers[1].firstName],
  //   lastName_in: [testUsers[1].lastName], email_in: [testUsers[1].email],
  //   appLanguageCode_in: [testUsers[1].appLanguageCode] } and
  //   sorted by args.orderBy === 'firstName_ASC'`, async () => {
  //     const where = {
  //       _id: {
  //         $in: [testUsers[1].id],
  //       },
  //       firstName: {
  //         $in: [testUsers[1].firstName],
  //       },
  //       lastName: {
  //         $in: [testUsers[1].lastName],
  //       },
  //       email: {
  //         $in: [testUsers[1].email],
  //       },
  //       appLanguageCode: {
  //         $in: [testUsers[1].appLanguageCode],
  //       },
  //     };
  //     const sort = {
  //       firstName: 1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: {
  //         id_in: [testUsers[1].id],
  //         firstName_in: [testUsers[1].firstName],
  //         lastName_in: [testUsers[1].lastName],
  //         email_in: [testUsers[1].email],
  //         appLanguageCode_in: [testUsers[1].appLanguageCode],
  //       },
  //       orderBy: "firstName_ASC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users filtered by
  //   args.where === { id_not_in: [testUsers[2]._id], firstName_not_in: [testUsers[2].firstName],
  //   lastName_not_in: [testUsers[2].lastName], email_not_in: [testUsers[2].email],
  //   appLanguageCode_not_in: [testUsers[2].appLanguageCode] } and
  //   sorted by args.orderBy === 'firstName_DESC'`, async () => {
  //     const where = {
  //       _id: {
  //         $nin: [testUsers[2]._id],
  //       },
  //       firstName: {
  //         $nin: [testUsers[2].firstName],
  //       },
  //       lastName: {
  //         $nin: [testUsers[2].lastName],
  //       },
  //       email: {
  //         $nin: [testUsers[2].email],
  //       },
  //       appLanguageCode: {
  //         $nin: [testUsers[2].appLanguageCode],
  //       },
  //     };
  //     const sort = {
  //       firstName: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: {
  //         id_not_in: [testUsers[2]._id],
  //         firstName_not_in: [testUsers[2].firstName],
  //         lastName_not_in: [testUsers[2].lastName],
  //         email_not_in: [testUsers[2].email],
  //         appLanguageCode_not_in: [testUsers[2].appLanguageCode],
  //       },
  //       orderBy: "firstName_DESC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users filtered by
  //   args.where === { firstName_contains: testUsers[1].firstName,
  //   lastName_contains: testUsers[1].lastName, email_contains: testUsers[1].email,
  //   appLanguageCode_contains: testUsers[1].appLanguageCode } and
  //   sorted by args.orderBy === 'lastName_ASC'`, async () => {
  //     const where = {
  //       firstName: {
  //         $regex: testUsers[1].firstName,
  //         $options: 'i',
  //       },
  //       lastName: {
  //         $regex: testUsers[1].lastName,
  //         $options: 'i',
  //       },
  //       email: {
  //         $regex: testUsers[1].email,
  //         $options: 'i',
  //       },
  //       appLanguageCode: {
  //         $regex: testUsers[1].appLanguageCode,
  //         $options: 'i',
  //       },
  //     };
  //     const sort = {
  //       lastName: 1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: {
  //         firstName_contains: testUsers[1].firstName,
  //         lastName_contains: testUsers[1].lastName,
  //         email_contains: testUsers[1].email,
  //         appLanguageCode_contains: testUsers[1].appLanguageCode,
  //       },
  //       orderBy: "lastName_ASC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users filtered by
  //   args.where === { firstName_starts_with: testUsers[1].firstName,
  //   lastName_starts_with: testUsers[1].lastName, email_starts_with: testUsers[1].email,
  //   appLanguageCode_starts_with: testUsers[1].appLanguageCode } and
  //   sorted by args.orderBy === 'lastName_DESC'`, async () => {
  //     const where = {
  //       firstName: new RegExp('^' + testUsers[1].firstName),
  //       lastName: new RegExp('^' + testUsers[1].lastName),
  //       email: new RegExp('^' + testUsers[1].email),
  //       appLanguageCode: new RegExp('^' + testUsers[1].appLanguageCode),
  //     };
  //     const sort = {
  //       lastName: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: {
  //         firstName_starts_with: testUsers[1].firstName,
  //         lastName_starts_with: testUsers[1].lastName,
  //         email_starts_with: testUsers[1].email,
  //         appLanguageCode_starts_with: testUsers[1].appLanguageCode,
  //       },
  //       orderBy: "lastName_DESC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users sorted by
  //   args.orderBy === 'appLanguageCode_ASC'`, async () => {
  //     const where = {};
  //     const sort = {
  //       appLanguageCode: 1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: null,
  //       orderBy: "appLanguageCode_ASC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users sorted by
  //    args.orderBy === 'appLanguageCode_DESC'`, async () => {
  //     const where = {};
  //     const sort = {
  //       appLanguageCode: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: null,
  //       orderBy: "appLanguageCode_DESC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users
  //   sorted by args.orderBy === 'email_ASC'`, async () => {
  //     const where = {};
  //     const sort = {
  //       email: 1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: null,
  //       orderBy: "email_ASC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users
  //   sorted by args.orderBy === 'email_DESC'`, async () => {
  //     const where = {};
  //     const sort = {
  //       email: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: null,
  //       orderBy: "email_DESC",
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
  //   it(`returns paginated list of users sorted by 'email_DESC' if
  //   args.orderBy === undefined`, async () => {
  //     const where = {};
  //     const sort = {
  //       email: -1,
  //     };
  //     const args: QueryOrganizationsMemberConnectionArgs = {
  //       first: 2,
  //       skip: 1,
  //       where: null,
  //       orderBy: undefined,
  //     };
  //     const organizationsMemberConnectionPayload =
  //       await organizationsMemberConnectionResolver?.({}, args, {});
  //     const users = await User.find(where)
  //       .limit(2)
  //       .skip(1)
  //       .sort(sort)
  //       .select(['-password'])
  //       .populate('createdOrganizations')
  //       .populate('createdEvents')
  //       .populate('joinedOrganizations')
  //       .populate('registeredEvents')
  //       .populate('eventAdmin')
  //       .populate('adminFor')
  //       .lean();
  //     expect(organizationsMemberConnectionPayload).toEqual(users);
  //   });
});
