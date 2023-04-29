import "dotenv/config";
import { organizationsMemberConnection as organizationsMemberConnectionResolver } from "../../../src/resolvers/Query/organizationsMemberConnection";
import type { InterfaceOrganization, InterfaceUser } from "../../../src/models";
import { Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { QueryOrganizationsMemberConnectionArgs } from "../../../src/types/generatedGraphQLTypes";

import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { BASE_URL } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: (InterfaceUser & Document<any, any, InterfaceUser>)[];
let testOrganization: InterfaceOrganization &
  Document<any, any, InterfaceOrganization>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

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
  await disconnect(MONGOOSE_INSTANCE);
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

  it(`returns paginated list of users filtered by
    args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
    lastName: testUsers[1].lastName, email: testUsers[1].email,
    appLanguageCode: testUsers[1].appLanguageCode } and sorted by
    args.orderBy === 'id_ASC'`, async () => {
    const where = {
      _id: testUsers[1].id,
      firstName: testUsers[1].firstName,
      lastName: testUsers[1].lastName,
      email: testUsers[1].email,
      appLanguageCode: testUsers[1].appLanguageCode,
    };

    const sort = {
      _id: 1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization.id,
      first: 1,
      skip: 1,
      where: {
        id: testUsers[1].id,
        firstName: testUsers[1].firstName,
        lastName: testUsers[1].lastName,
        email: testUsers[1].email,
        appLanguageCode: testUsers[1].appLanguageCode,
      },
      orderBy: "id_ASC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 1,
      },
    });
  });

  it(`returns paginated list of users filtered by
    args.where === { id_not: testUsers[2]._id, firstName_not: testUsers[2].firstName,
    lastName_not: testUsers[2].lastName, email_not: testUsers[2].email,
    appLanguageCode_not: testUsers[2].appLanguageCode } and
    sorted by args.orderBy === 'id_Desc'`, async () => {
    const where = {
      _id: {
        $ne: testUsers[2]._id,
      },
      firstName: {
        $ne: testUsers[2].firstName,
      },
      lastName: {
        $ne: testUsers[2].lastName,
      },
      email: {
        $ne: testUsers[2].email,
      },
      appLanguageCode: {
        $ne: testUsers[2].appLanguageCode,
      },
    };

    const sort = {
      _id: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization.id,
      first: 2,
      skip: 1,
      where: {
        id_not: testUsers[2]._id,
        firstName_not: testUsers[2].firstName,
        lastName_not: testUsers[2].lastName,
        email_not: testUsers[2].email,
        appLanguageCode_not: testUsers[2].appLanguageCode,
      },
      orderBy: "id_DESC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .limit(2)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 2,
      },
    });
  });

  it(`returns paginated list of users filtered by
    args.where === { id_in: [testUsers[1].id], firstName_in: [testUsers[1].firstName],
    lastName_in: [testUsers[1].lastName], email_in: [testUsers[1].email],
    appLanguageCode_in: [testUsers[1].appLanguageCode] } and
    sorted by args.orderBy === 'firstName_ASC'`, async () => {
    const where = {
      _id: {
        $in: [testUsers[1].id],
      },
      firstName: {
        $in: [testUsers[1].firstName],
      },
      lastName: {
        $in: [testUsers[1].lastName],
      },
      email: {
        $in: [testUsers[1].email],
      },
      appLanguageCode: {
        $in: [testUsers[1].appLanguageCode],
      },
    };

    const sort = {
      firstName: 1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {
        id_in: [testUsers[1].id],
        firstName_in: [testUsers[1].firstName],
        lastName_in: [testUsers[1].lastName],
        email_in: [testUsers[1].email],
        appLanguageCode_in: [testUsers[1].appLanguageCode],
      },
      orderBy: "firstName_ASC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 1,
      },
    });
  });

  it(`returns paginated list of users filtered by
    args.where === { id_not_in: [testUsers[2]._id], firstName_not_in: [testUsers[2].firstName],
    lastName_not_in: [testUsers[2].lastName], email_not_in: [testUsers[2].email],
    appLanguageCode_not_in: [testUsers[2].appLanguageCode] } and
    sorted by args.orderBy === 'FirstNameDesc'`, async () => {
    const where = {
      _id: {
        $nin: [testUsers[2]._id],
      },
      firstName: {
        $nin: [testUsers[2].firstName],
      },
      lastName: {
        $nin: [testUsers[2].lastName],
      },
      email: {
        $nin: [testUsers[2].email],
      },
      appLanguageCode: {
        $nin: [testUsers[2].appLanguageCode],
      },
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      firstName: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {
        id_not_in: [testUsers[2]._id],
        firstName_not_in: [testUsers[2].firstName],
        lastName_not_in: [testUsers[2].lastName],
        email_not_in: [testUsers[2].email],
        appLanguageCode_not_in: [testUsers[2].appLanguageCode],
      },
      orderBy: "firstName_DESC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 2,
      },
    });
  });

  it(`returns paginated list of users filtered by
    args.where === { firstName_contains: testUsers[1].firstName,
    lastName_contains: testUsers[1].lastName, email_contains: testUsers[1].email,
    appLanguageCode_contains: testUsers[1].appLanguageCode } and
    sorted by args.orderBy === 'lastName_ASC'`, async () => {
    const where = {
      firstName: {
        $regex: testUsers[1].firstName,
        $options: "i",
      },
      lastName: {
        $regex: testUsers[1].lastName,
        $options: "i",
      },
      email: {
        $regex: testUsers[1].email,
        $options: "i",
      },
      appLanguageCode: {
        $regex: testUsers[1].appLanguageCode,
        $options: "i",
      },
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      lastName: 1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {
        firstName_contains: testUsers[1].firstName,
        lastName_contains: testUsers[1].lastName,
        email_contains: testUsers[1].email,
        appLanguageCode_contains: testUsers[1].appLanguageCode,
      },
      orderBy: "lastName_ASC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 1,
      },
    });
  });

  it(`returns paginated list of users filtered by
    args.where === { firstName_starts_with: testUsers[1].firstName,
    lastName_starts_with: testUsers[1].lastName, email_starts_with: testUsers[1].email,
    appLanguageCode_starts_with: testUsers[1].appLanguageCode } and
    sorted by args.orderBy === 'lastName_DESC'`, async () => {
    const where = {
      firstName: new RegExp("^" + testUsers[0].firstName),
      lastName: new RegExp("^" + testUsers[0].lastName),
      email: new RegExp("^" + testUsers[0].email),
      appLanguageCode: new RegExp("^" + testUsers[0].appLanguageCode),
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      lastName: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {
        firstName_starts_with: testUsers[0].firstName,
        lastName_starts_with: testUsers[0].lastName,
        email_starts_with: testUsers[0].email,
        appLanguageCode_starts_with: testUsers[0].appLanguageCode,
      },
      orderBy: "lastName_DESC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 1,
      },
    });
  });

  it(`returns paginated list of users sorted by
    args.orderBy === 'appLanguageCode_ASC'`, async () => {
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      appLanguageCode: 1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {},
      orderBy: "appLanguageCode_ASC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .limit(2)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        totalPages: 2,
        nextPageNo: 2,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 3,
      },
    });
  });

  it(`returns paginated list of users sorted by
     args.orderBy === 'appLanguageCode_DESC'`, async () => {
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      appLanguageCode: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: {},
      orderBy: "appLanguageCode_DESC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .limit(2)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        totalPages: 2,
        nextPageNo: 2,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 3,
      },
    });
  });

  it(`returns paginated list of users
    sorted by args.orderBy === 'email_ASC'`, async () => {
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      email: 1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: null,
      orderBy: "email_ASC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .limit(2)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        totalPages: 2,
        nextPageNo: 2,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 3,
      },
    });
  });

  it(`returns paginated list of users
    sorted by args.orderBy === 'email_DESC'`, async () => {
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      email: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: null,
      orderBy: "email_DESC",
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const users = await User.find(where)
      .sort(sort)
      .limit(2)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: user.image || null,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        totalPages: 2,
        nextPageNo: 2,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 3,
      },
    });
  });

  it(`throws Error if args.skip === null`, async () => {
    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: null,
      where: null,
      orderBy: undefined,
    };

    try {
      await organizationsMemberConnectionResolver?.({}, args, {});
    } catch (error: any) {
      expect(error).toEqual(
        "Missing Skip parameter. Set it to either 0 or some other value"
      );
    }
  });

  it(`throws Error if args.skip === undefined`, async () => {
    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: undefined,
      where: null,
      orderBy: undefined,
    };

    try {
      await organizationsMemberConnectionResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Skip parameter is missing");
    }
  });

  it(`returns non-paginated list of users if args.first === undefined`, async () => {
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      skip: 1,
      where: {},
      orderBy: null,
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, {});

    const usersTestModel = await User.paginate(where, {
      pagination: false,
      sort: {},
      populate: ["registeredEvents"],
      select: ["-password"],
    });

    const users = usersTestModel.docs.map((user) => {
      return {
        ...user._doc,
        password: null,
        image: null,
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: users,
      aggregate: {
        count: 3,
      },
    });
  });
  it(`returns paginated list of users
    sorted by args.orderBy === 'email_DESC' and image is not undefined`, async () => {
    await User.updateMany(
      {},
      {
        $set: {
          image: `image/image.png`,
        },
      }
    );
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const sort = {
      email: -1,
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      first: 2,
      skip: 1,
      where: null,
      orderBy: "email_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, context);
    const users = await User.find(where)
      .sort(sort)
      .limit(2)
      .select(["-password"])
      .populate(["registeredEvents"])
      .lean();

    const usersWithPassword = users.map((user) => {
      return {
        ...user,
        password: null,
        image: `${BASE_URL}${user.image}`,
        id: String(user._id),
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        totalPages: 2,
        nextPageNo: 2,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: usersWithPassword,
      aggregate: {
        count: 3,
      },
    });
  });
  it(`returns non-paginated list of admins if args.first === undefined and where.admin_for !== undefined`, async () => {
    await User.updateMany(
      {},
      {
        $set: {
          image: `image/image.png`,
        },
      }
    );
    const where = {
      joinedOrganizations: {
        $in: testOrganization._id,
      },
    };

    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      skip: 1,
      where: {
        admin_for: testOrganization._id,
      },
      orderBy: null,
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const organizationsMemberConnectionPayload =
      await organizationsMemberConnectionResolver?.({}, args, context);

    const usersTestModel = await User.paginate(where, {
      pagination: false,
      sort: {},
      populate: ["registeredEvents"],
      select: ["-password"],
    });

    const users = usersTestModel.docs.map((user) => {
      return {
        ...user._doc,
        image: `${BASE_URL}${user.image}`,
        password: null,
      };
    });

    expect(organizationsMemberConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: users,
      aggregate: {
        count: 3,
      },
    });
  });

  it(`returns non-paginated list of admins if args.first === undefined and where.event_title_contains !== undefined`, async () => {
    const args: QueryOrganizationsMemberConnectionArgs = {
      orgId: testOrganization._id,
      skip: 1,
      where: {
        event_title_contains: "testEvent",
      },
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
});
