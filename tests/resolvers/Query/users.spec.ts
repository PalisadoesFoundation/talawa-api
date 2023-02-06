import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/Query/users";
import { Event, Interface_User, Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { QueryUsersArgs } from "../../../src/types/generatedGraphQLTypes";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import * as mongoose from "mongoose";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> users", () => {
  it("throws NotFoundError if no user exists", async () => {
    const testObjectId = new mongoose.Types.ObjectId();

    vi.doMock("../../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../../src/constants"
      );
      return {
        ...actualConstants,
        IN_PRODUCTION: true,
      };
    });

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryUsersArgs = {
        orderBy: null,
        where: {
          id: testObjectId as unknown as string,
        },
      };

      const { users: mockedInProductionUserResolver } = await import(
        "../../../src/resolvers/Query/users"
      );
      await mockedInProductionUserResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }

    vi.doUnmock("../../../src/constants");
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
      ]);

      const testOrganization = await Organization.create({
        name: "name1",
        description: "description1",
        isPublic: true,
        creator: testUsers[0]._id,
        admins: [testUsers[0]._id],
        members: [testUsers[0]._id],
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
        creator: testUsers[0]._id,
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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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

      const usersPayload = await usersResolver?.({}, args, {});

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
      }));

      expect(usersPayload).toEqual(users);
    });
  });
});
