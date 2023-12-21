import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/Query/users";
import type { InterfaceUser } from "../../../src/models";
import { Event, Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryUsersArgs } from "../../../src/types/generatedGraphQLTypes";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { BASE_URL, UNAUTHENTICATED_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import * as mongoose from "mongoose";
import { createTestUser } from "../../helpers/user";

let testUsers: (InterfaceUser & Document<any, any, InterfaceUser>)[];

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> users", () => {
  it("throws UnauthenticatedError if userId is not passed in context", async () => {
    const testObjectId = new mongoose.Types.ObjectId();

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryUsersArgs = {
        orderBy: null,
        where: {
          id: testObjectId.toString(),
        },
      };

      const { users: mockedInProductionUserResolver } = await import(
        "../../../src/resolvers/Query/users"
      );
      await mockedInProductionUserResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(UNAUTHENTICATED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${UNAUTHENTICATED_ERROR.MESSAGE}`
      );
    }

    vi.resetModules();
  });

  it("returns empty array if no user exists", async () => {
    const testObjectId = new mongoose.Types.ObjectId();

    const testUser = await createTestUser();

    const args: QueryUsersArgs = {
      orderBy: null,
      where: {
        id: testObjectId.toString(),
      },
    };

    const { users: mockedInProductionUserResolver } = await import(
      "../../../src/resolvers/Query/users"
    );

    const usersPayload = await mockedInProductionUserResolver?.({}, args, {
      userId: testUser?._id,
    });

    expect(usersPayload).toEqual([]);

    vi.resetModules();
  });

  describe("", () => {
    beforeAll(async () => {
      testUsers = await User.insertMany([
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
          appLanguageCode: `en${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
          appLanguageCode: `en${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
          appLanguageCode: `en${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
          appLanguageCode: `en${nanoid()}`,
          userType: "SUPERADMIN",
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
          appLanguageCode: `en${nanoid()}`,
          userType: "ADMIN",
        },
      ]);

      const testOrganization = await Organization.create({
        name: "name1",
        description: "description1",
        isPublic: true,
        createdBy: testUsers[0]._id,
        admins: [testUsers[0]._id],
        members: [testUsers[0]._id, testUsers[1]._id],
        apiUrl: "apiUrl1",
      });

      const testEvent = await Event.create({
        title: "title",
        description: "description",
        recurring: true,
        allDay: true,
        startDate: new Date().toString(),
        isPublic: true,
        isRegisterable: true,
        createdBy: testUsers[0]._id,
        registrants: [
          {
            userId: testUsers[0]._id,
            user: testUsers[0]._id,
          },
        ],
        admins: [testUsers[0]._id],
        organization: testOrganization._id,
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
            createdEvents: testEvent._id,
            registeredEvents: testEvent._id,
            eventAdmin: testEvent._id,
          },
        }
      );

      await User.updateOne(
        {
          _id: testUsers[1]._id,
        },
        {
          $push: {
            joinedOrganizations: testOrganization._id,
            organizationsBlockedBy: testOrganization._id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            blockedUsers: testUsers[1]._id,
          },
        }
      );
    });

    it(`returns empty array for organizationsBlockedBy fields when the client is a normal user`, async () => {
      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
        },
      };

      const sort = {
        _id: 1,
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[1]._id,
      });

      let users = await User.find({
        _id: testUsers[1].id,
      })
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns populated array for organizationsBlockedBy fields when the client is a SUPERADMIN`, async () => {
      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
        },
      };

      const sort = {
        _id: 1,
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[3]._id,
      });

      let users = await User.find({
        _id: testUsers[1].id,
      })
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .populate("organizationsBlockedBy")
        .lean();

      users = users.map((user) => ({
        ...user,
        image: null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns populated array for organizationsBlockedBy fields when the client is a ADMIN`, async () => {
      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
        },
      };

      const sort = {
        _id: 1,
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[4]._id,
      });

      let users = await User.find({
        _id: testUsers[1].id,
      })
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .populate("organizationsBlockedBy")
        .lean();

      users = users.map((user) => ({
        ...user,
        image: null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
    lastName: testUsers[1].lastName, email: testUsers[1].email,
    appLanguageCode: testUsers[1].appLanguageCode }, args.adminApproved: true 
    and args.userType : "SUPERADMIN" and sorted by
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

      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
          firstName: testUsers[1].firstName,
          lastName: testUsers[1].lastName,
          email: testUsers[1].email,
          appLanguageCode: testUsers[1].appLanguageCode,
        },
        userType: "SUPERADMIN",
        adminApproved: true,
        orderBy: "id_ASC",
      };

      const filterCriteria = {
        ...where,
        userType: args.userType as string,
        adminApproved: args.adminApproved as boolean,
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });

      let users = await User.find(filterCriteria)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
    lastName: testUsers[1].lastName, email: testUsers[1].email,
    appLanguageCode: testUsers[1].appLanguageCode }, args.adminApproved: false 
    and args.userType : "SUPERADMIN" and sorted by
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

      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
          firstName: testUsers[1].firstName,
          lastName: testUsers[1].lastName,
          email: testUsers[1].email,
          appLanguageCode: testUsers[1].appLanguageCode,
        },
        userType: "SUPERADMIN",
        adminApproved: false,
        orderBy: "id_ASC",
      };

      const filterCriteria = {
        ...where,
        userType: args.userType as string,
        adminApproved: args.adminApproved as boolean,
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });

      let users = await User.find(filterCriteria)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
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

      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
          firstName: testUsers[1].firstName,
          lastName: testUsers[1].lastName,
          email: testUsers[1].email,
          appLanguageCode: testUsers[1].appLanguageCode,
        },
        orderBy: "id_ASC",
      };

      // const user = await createTestUser();

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
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

      const args: QueryUsersArgs = {
        where: {
          id_not: testUsers[2]._id,
          firstName_not: testUsers[2].firstName,
          lastName_not: testUsers[2].lastName,
          email_not: testUsers[2].email,
          appLanguageCode_not: testUsers[2].appLanguageCode,
        },
        orderBy: "id_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
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

      const args: QueryUsersArgs = {
        where: {
          id_in: [testUsers[1].id],
          firstName_in: [testUsers[1].firstName],
          lastName_in: [testUsers[1].lastName],
          email_in: [testUsers[1].email],
          appLanguageCode_in: [testUsers[1].appLanguageCode],
        },
        orderBy: "firstName_ASC",
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
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
      };

      const sort = {
        firstName: -1,
      };

      const args: QueryUsersArgs = {
        where: {
          id_not_in: [testUsers[2]._id],
          firstName_not_in: [testUsers[2].firstName],
          lastName_not_in: [testUsers[2].lastName],
          email_not_in: [testUsers[2].email],
          appLanguageCode_not_in: [testUsers[2].appLanguageCode],
        },
        orderBy: "firstName_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
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
      };

      const sort = {
        lastName: 1,
      };

      const args: QueryUsersArgs = {
        where: {
          firstName_contains: testUsers[1].firstName,
          lastName_contains: testUsers[1].lastName,
          email_contains: testUsers[1].email,
          appLanguageCode_contains: testUsers[1].appLanguageCode,
        },
        orderBy: "lastName_ASC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { firstName_starts_with: testUsers[1].firstName,
    lastName_starts_with: testUsers[1].lastName, email_starts_with: testUsers[1].email,
    appLanguageCode_starts_with: testUsers[1].appLanguageCode } and
    sorted by args.orderBy === 'lastName_DESC'`, async () => {
      const where = {
        firstName: new RegExp("^" + testUsers[1].firstName),
        lastName: new RegExp("^" + testUsers[1].lastName),
        email: new RegExp("^" + testUsers[1].email),
        appLanguageCode: new RegExp("^" + testUsers[1].appLanguageCode),
      };

      const sort = {
        lastName: -1,
      };

      const args: QueryUsersArgs = {
        where: {
          firstName_starts_with: testUsers[1].firstName,
          lastName_starts_with: testUsers[1].lastName,
          email_starts_with: testUsers[1].email,
          appLanguageCode_starts_with: testUsers[1].appLanguageCode,
        },
        orderBy: "lastName_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };
      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users sorted by
  args.orderBy === 'appLanguageCode_ASC'`, async () => {
      const where = {};

      const sort = {
        appLanguageCode: 1,
      };

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "appLanguageCode_ASC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users sorted by
     args.orderBy === 'appLanguageCode_DESC'`, async () => {
      const where = {};

      const sort = {
        appLanguageCode: -1,
      };

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "appLanguageCode_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users
    sorted by args.orderBy === 'email_ASC'`, async () => {
      const where = {};

      const sort = {
        email: 1,
      };

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "email_ASC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });

    it(`returns list of all existing users
    sorted by args.orderBy === 'email_DESC'`, async () => {
      const where = {};

      const sort = {
        email: -1,
      };

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "email_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);

      let users = await User.find(where)
        .sort(sort)
        .select(["-password"])
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(usersPayload).toEqual(users);
    });
  });
  it(`returns list of all existing users
  sorted by args.orderBy === 'email_DESC' and when images exist`, async () => {
    const where = {};

    const sort = {
      email: -1,
    };

    await User.updateMany(
      {},
      {
        $set: {
          image: "images/image.png",
        },
      }
    );

    const args: QueryUsersArgs = {
      where: null,
      orderBy: "email_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
      userId: testUsers[0]._id,
    };

    const usersPayload = await usersResolver?.({}, args, context);

    let users = await User.find(where)
      .sort(sort)
      .select(["-password"])
      .populate("createdOrganizations")
      .populate("createdEvents")
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .populate("eventAdmin")
      .populate("adminFor")
      .lean();

    users = users.map((user) => ({
      ...user,
      organizationsBlockedBy: [],
      image: user.image ? `${context.apiRootUrl}${user.image}` : null,
    }));

    expect(usersPayload).toEqual(users);
  });
});
