import "dotenv/config";
import { postsByOrganizationConnection as postsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/postsByOrganizationConnection";
import { connect, disconnect } from "../../../src/db";
import {Types } from "mongoose";
import { QueryPostsByOrganizationConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";
import { testPostType, testCommentType, createPostwithComment, createTestSinglePost} from "../../helpers/posts";

let testOrganization: testOrganizationType;
let testUser: testUserType;
let testPost1: testPostType;
let testComment: testCommentType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization, testPost1, testComment] = await createPostwithComment();

  const testPost2 = await createTestSinglePost(testUser._id,testOrganization._id);
  const testPost3 = await createTestSinglePost(testUser._id,testOrganization._id);

  const testPosts = [testPost1, testPost2, testPost3];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> users", () => {
  it(`when no organization exists with _id === args.id`, async () => {
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: Types.ObjectId().toString(),
      first: 2,
      skip: 1,
      where: null,
      orderBy: null,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    expect(postsByOrganizationConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: [],
      aggregate: { count: 0 },
    });
  });

  // it(`returns paginated list of users filtered by
  // args.where === { id_not: testUsers[2]._id, firstName_not: testUsers[2].firstName,
  // lastName_not: testUsers[2].lastName, email_not: testUsers[2].email,
  // appLanguageCode_not: testUsers[2].appLanguageCode } and
  // sorted by args.orderBy === 'id_Desc'`, async () => {
  //   const where = {
  //     _id: {
  //       $ne: testUsers[2]._id,
  //     },
  //     firstName: {
  //       $ne: testUsers[2].firstName,
  //     },
  //     lastName: {
  //       $ne: testUsers[2].lastName,
  //     },
  //     email: {
  //       $ne: testUsers[2].email,
  //     },
  //     appLanguageCode: {
  //       $ne: testUsers[2].appLanguageCode,
  //     },
  //   };

  //   const sort = {
  //     _id: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: {
  //       id_not: testUsers[2]._id,
  //       firstName_not: testUsers[2].firstName,
  //       lastName_not: testUsers[2].lastName,
  //       email_not: testUsers[2].email,
  //       appLanguageCode_not: testUsers[2].appLanguageCode,
  //     },
  //     orderBy: "id_DESC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users filtered by
  // args.where === { id_in: [testUsers[1].id], firstName_in: [testUsers[1].firstName],
  // lastName_in: [testUsers[1].lastName], email_in: [testUsers[1].email],
  // appLanguageCode_in: [testUsers[1].appLanguageCode] } and
  // sorted by args.orderBy === 'firstName_ASC'`, async () => {
  //   const where = {
  //     _id: {
  //       $in: [testUsers[1].id],
  //     },
  //     firstName: {
  //       $in: [testUsers[1].firstName],
  //     },
  //     lastName: {
  //       $in: [testUsers[1].lastName],
  //     },
  //     email: {
  //       $in: [testUsers[1].email],
  //     },
  //     appLanguageCode: {
  //       $in: [testUsers[1].appLanguageCode],
  //     },
  //   };

  //   const sort = {
  //     firstName: 1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: {
  //       id_in: [testUsers[1].id],
  //       firstName_in: [testUsers[1].firstName],
  //       lastName_in: [testUsers[1].lastName],
  //       email_in: [testUsers[1].email],
  //       appLanguageCode_in: [testUsers[1].appLanguageCode],
  //     },
  //     orderBy: "firstName_ASC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users filtered by
  // args.where === { id_not_in: [testUsers[2]._id], firstName_not_in: [testUsers[2].firstName],
  // lastName_not_in: [testUsers[2].lastName], email_not_in: [testUsers[2].email],
  // appLanguageCode_not_in: [testUsers[2].appLanguageCode] } and
  // sorted by args.orderBy === 'firstName_DESC'`, async () => {
  //   const where = {
  //     _id: {
  //       $nin: [testUsers[2]._id],
  //     },
  //     firstName: {
  //       $nin: [testUsers[2].firstName],
  //     },
  //     lastName: {
  //       $nin: [testUsers[2].lastName],
  //     },
  //     email: {
  //       $nin: [testUsers[2].email],
  //     },
  //     appLanguageCode: {
  //       $nin: [testUsers[2].appLanguageCode],
  //     },
  //   };

  //   const sort = {
  //     firstName: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: {
  //       id_not_in: [testUsers[2]._id],
  //       firstName_not_in: [testUsers[2].firstName],
  //       lastName_not_in: [testUsers[2].lastName],
  //       email_not_in: [testUsers[2].email],
  //       appLanguageCode_not_in: [testUsers[2].appLanguageCode],
  //     },
  //     orderBy: "firstName_DESC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users filtered by
  // args.where === { firstName_contains: testUsers[1].firstName,
  // lastName_contains: testUsers[1].lastName, email_contains: testUsers[1].email,
  // appLanguageCode_contains: testUsers[1].appLanguageCode } and
  // sorted by args.orderBy === 'lastName_ASC'`, async () => {
  //   const where = {
  //     firstName: {
  //       $regex: testUsers[1].firstName,
  //       $options: 'i',
  //     },
  //     lastName: {
  //       $regex: testUsers[1].lastName,
  //       $options: 'i',
  //     },
  //     email: {
  //       $regex: testUsers[1].email,
  //       $options: 'i',
  //     },
  //     appLanguageCode: {
  //       $regex: testUsers[1].appLanguageCode,
  //       $options: 'i',
  //     },
  //   };

  //   const sort = {
  //     lastName: 1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: {
  //       firstName_contains: testUsers[1].firstName,
  //       lastName_contains: testUsers[1].lastName,
  //       email_contains: testUsers[1].email,
  //       appLanguageCode_contains: testUsers[1].appLanguageCode,
  //     },
  //     orderBy: "lastName_ASC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users filtered by
  // args.where === { firstName_starts_with: testUsers[1].firstName,
  // lastName_starts_with: testUsers[1].lastName, email_starts_with: testUsers[1].email,
  // appLanguageCode_starts_with: testUsers[1].appLanguageCode } and
  // sorted by args.orderBy === 'lastName_DESC'`, async () => {
  //   const where = {
  //     firstName: new RegExp('^' + testUsers[1].firstName),
  //     lastName: new RegExp('^' + testUsers[1].lastName),
  //     email: new RegExp('^' + testUsers[1].email),
  //     appLanguageCode: new RegExp('^' + testUsers[1].appLanguageCode),
  //   };

  //   const sort = {
  //     lastName: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: {
  //       firstName_starts_with: testUsers[1].firstName,
  //       lastName_starts_with: testUsers[1].lastName,
  //       email_starts_with: testUsers[1].email,
  //       appLanguageCode_starts_with: testUsers[1].appLanguageCode,
  //     },
  //     orderBy: "lastName_DESC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users sorted by
  // args.orderBy === 'appLanguageCode_ASC'`, async () => {
  //   const where = {};

  //   const sort = {
  //     appLanguageCode: 1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: null,
  //     orderBy: "appLanguageCode_ASC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users sorted by
  //  args.orderBy === 'appLanguageCode_DESC'`, async () => {
  //   const where = {};

  //   const sort = {
  //     appLanguageCode: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: null,
  //     orderBy: "appLanguageCode_DESC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users
  // sorted by args.orderBy === 'email_ASC'`, async () => {
  //   const where = {};

  //   const sort = {
  //     email: 1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: null,
  //     orderBy: "email_ASC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users
  // sorted by args.orderBy === 'email_DESC'`, async () => {
  //   const where = {};

  //   const sort = {
  //     email: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: null,
  //     orderBy: "email_DESC",
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });

  // it(`returns paginated list of users sorted by 'email_DESC' if
  // args.orderBy === undefined`, async () => {
  //   const where = {};

  //   const sort = {
  //     email: -1,
  //   };

  //   const args: QueryPostsByOrganizationConnectionArgs = {
  //     first: 2,
  //     skip: 1,
  //     where: null,
  //     orderBy: undefined,
  //   };

  //   const postsByOrganizationConnectionPayload =
  //     await postsByOrganizationConnectionResolver?.({}, args, {});

  //   const users = await User.find(where)
  //     .limit(2)
  //     .skip(1)
  //     .sort(sort)
  //     .select(['-password'])
  //     .populate('createdOrganizations')
  //     .populate('createdEvents')
  //     .populate('joinedOrganizations')
  //     .populate('registeredEvents')
  //     .populate('eventAdmin')
  //     .populate('adminFor')
  //     .lean();

  //   expect(postsByOrganizationConnectionPayload).toEqual(users);
  // });
});
