import "dotenv/config";
import type { Document } from "mongoose";
import * as mongoose from "mongoose";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BASE_URL, UNAUTHENTICATED_ERROR } from "../../../src/constants";
import type { InterfaceUser } from "../../../src/models";
import { AppUserProfile, Event, Organization, User } from "../../../src/models";
import { users as usersResolver } from "../../../src/resolvers/Query/users";
import type { QueryUsersArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/user";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";

let testUsers: (InterfaceUser & Document<unknown, unknown, InterfaceUser>)[];

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const pledges = await FundraisingCampaignPledge.find({
    _id: new mongoose.Types.ObjectId(),
  }).lean();
  console.log(pledges);
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
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(UNAUTHENTICATED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${UNAUTHENTICATED_ERROR.MESSAGE}`,
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
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
        },
        {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
          firstName: `firstName${nanoid()}`,
          lastName: `lastName${nanoid()}`,
        },
      ]);
      const appUserProfiles = testUsers.map((user) => ({
        userId: user._id,
        appLanguageCode: `en${nanoid()}`,
      }));

      await AppUserProfile.insertMany(appUserProfiles);
      await AppUserProfile.updateOne(
        {
          userId: testUsers[3]._id,
        },
        {
          isSuperAdmin: true,
        },
      );

      const testOrganization = await Organization.create({
        name: "name1",
        description: "description1",
        userRegistrationRequired: false,
        creatorId: testUsers[0]._id,
        admins: [testUsers[0]._id],
        members: [testUsers[0]._id, testUsers[1]._id],
        apiUrl: "apiUrl1",
        visibleInSearch: true,
      });

      const testEvent = await Event.create({
        title: "title",
        description: "description",
        recurring: true,
        allDay: true,
        startDate: new Date().toString(),
        isPublic: true,
        isRegisterable: true,
        creatorId: testUsers[0]._id,
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
            joinedOrganizations: testOrganization._id,

            registeredEvents: testEvent._id,
          },
        },
      );
      await AppUserProfile.updateOne(
        {
          userId: testUsers[0]._id,
        },
        {
          $push: {
            adminFor: testOrganization._id,
            createdOrganizations: testOrganization._id,
            eventAdmin: testEvent._id,
            createdEvents: testEvent._id,
          },
        },
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
        },
      );

      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            blockedUsers: testUsers[1]._id,
          },
        },
      );

      await User.updateOne(
        {
          userId: testUsers[4]._id,
        },
        {
          $set: { appUserProfileId: null },
        },
      );

      await AppUserProfile.deleteOne({ userId: testUsers[4]._id });
    });

    it(`returns empty array for organizationsBlockedBy fields when the client is a normal user`, async () => {
      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
        },
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[1]._id,
      });
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );

      let users = await User.find({
        _id: testUsers[1].id,
      })
        .sort({
          _id: 1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: null,
      }));

      expect(payload).toEqual(users);
    });

    it(`returns populated array for organizationsBlockedBy fields when the client is a SUPERADMIN`, async () => {
      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
        },
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[3]._id,
      });
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find({
        _id: testUsers[1].id,
      })
        .sort({
          _id: 1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .populate("organizationsBlockedBy")
        .lean();

      users = users.map((user) => ({
        ...user,
        image: null,
      }));

      expect(payload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
    lastName: testUsers[1].lastName, email: testUsers[1].email} and sorted by
    args.orderBy === 'id_ASC'`, async () => {
      const where = {
        _id: testUsers[1].id,
        firstName: testUsers[1].firstName,
        lastName: testUsers[1].lastName,
        email: testUsers[1].email,
        // appLanguageCode: testUsers[1].appLanguageCode,
      };

      const args: QueryUsersArgs = {
        where: {
          id: testUsers[1].id,
          firstName: testUsers[1].firstName,
          lastName: testUsers[1].lastName,
          email: testUsers[1].email,
          // appLanguageCode: testUsers[1].appLanguageCode,
        },
        orderBy: "id_ASC",
      };

      // const user = await createTestUser();

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          _id: 1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));
      // console.log(usersPayload);
      expect(payload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { id_not: testUsers[2]._id, firstName_not: testUsers[2].firstName,
    lastName_not: testUsers[2].lastName, email_not: testUsers[2].email } and
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
      };

      const args: QueryUsersArgs = {
        where: {
          id_not: testUsers[2]._id.toString(),
          firstName_not: testUsers[2].firstName,
          lastName_not: testUsers[2].lastName,
          email_not: testUsers[2].email,
        },
        orderBy: "id_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );

      let users = await User.find(where)
        .sort({
          _id: -1,
        })
        .select(["-password"])

        .populate("joinedOrganizations")
        .populate("registeredEvents")

        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
    });

    it(`returns list of all existing users filtered by
    args.where === { id_in: [testUsers[1].id], firstName_in: [testUsers[1].firstName],
    lastName_in: [testUsers[1].lastName], email_in: [testUsers[1].email] } and
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
        // appLanguageCode: {
        //   $in: [testUsers[1].appLanguageCode],
        // },
      };

      const args: QueryUsersArgs = {
        where: {
          id_in: [testUsers[1].id],
          firstName_in: [testUsers[1].firstName],
          lastName_in: [testUsers[1].lastName],
          email_in: [testUsers[1].email],
          // appLanguageCode_in: [testUsers[1].appLanguageCode],
        },
        orderBy: "firstName_ASC",
      };

      const usersPayload = await usersResolver?.({}, args, {
        userId: testUsers[0]._id,
      });
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          firstName: 1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
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
      };

      const args: QueryUsersArgs = {
        where: {
          id_not_in: [testUsers[2]._id.toString()],
          firstName_not_in: [testUsers[2].firstName],
          lastName_not_in: [testUsers[2].lastName],
          email_not_in: [testUsers[2].email],
          // appLanguageCode_not_in: [testUsers[2].appLanguageCode],
        },
        orderBy: "firstName_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          firstName: -1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
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
        // appLanguageCode: {
        //   $regex: testUsers[1].appLanguageCode,
        //   $options: "i",
        // },
      };

      const args: QueryUsersArgs = {
        where: {
          firstName_contains: testUsers[1].firstName,
          lastName_contains: testUsers[1].lastName,
          email_contains: testUsers[1].email,
          // appLanguageCode_contains: testUsers[1].appLanguageCode,
        },
        orderBy: "lastName_ASC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          lastName: 1,
        })
        .select(["-password"])

        .populate("joinedOrganizations")
        .populate("registeredEvents")

        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
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
        // appLanguageCode: new RegExp("^" + testUsers[1].appLanguageCode),
      };

      const args: QueryUsersArgs = {
        where: {
          firstName_starts_with: testUsers[1].firstName,
          lastName_starts_with: testUsers[1].lastName,
          email_starts_with: testUsers[1].email,
          // appLanguageCode_starts_with: testUsers[1].appLanguageCode,
        },
        orderBy: "lastName_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };
      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          lastName: -1,
        })
        .select(["-password"])

        .populate("joinedOrganizations")
        .populate("registeredEvents")

        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
    });

    it(`returns list of all existing users
    sorted by args.orderBy === 'email_ASC'`, async () => {
      const where = {};

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "email_ASC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          email: 1,
        })
        .select(["-password"])

        .populate("joinedOrganizations")
        .populate("registeredEvents")

        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
    });

    it(`returns list of all existing users
    sorted by args.orderBy === 'email_DESC'`, async () => {
      const where = {};

      const args: QueryUsersArgs = {
        where: null,
        orderBy: "email_DESC",
      };

      const context = {
        apiRootUrl: BASE_URL,
        userId: testUsers[0]._id,
      };

      const usersPayload = await usersResolver?.({}, args, context);
      const payload = usersPayload?.map(
        // @ts-expect-error-ignore
        (userConnection) => userConnection?.user,
      );
      let users = await User.find(where)
        .sort({
          email: -1,
        })
        .select(["-password"])
        .populate("joinedOrganizations")
        .populate("registeredEvents")
        .lean();

      users = users.map((user) => ({
        ...user,
        organizationsBlockedBy: [],
        image: user.image ? `${BASE_URL}${user.image}` : null,
      }));

      expect(payload).toEqual(users);
    });
  });
  it(`returns list of all existing users
  sorted by args.orderBy === 'email_DESC' and when images exist`, async () => {
    const where = {};

    await User.updateMany(
      {},
      {
        $set: {
          image: "images/image.png",
        },
      },
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
    const payload = usersPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );
    let users = await User.find(where)
      .sort({
        email: -1,
      })
      .select(["-password"])

      .populate("joinedOrganizations")
      .populate("registeredEvents")

      .lean();

    users = users.map((user) => ({
      ...user,
      organizationsBlockedBy: [],
      image: user.image ? `${context.apiRootUrl}${user.image}` : null,
    }));

    expect(payload).toEqual(users);
  });
  it("throws error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    await AppUserProfile.deleteOne({
      userId: testUsers[0]._id,
    });
    const args: QueryUsersArgs = {
      orderBy: null,
      where: {
        id: testUsers[0].id,
      },
    };
    const context = {
      userId: testUsers[0]._id,
    };
    try {
      const { users: mockedInProductionUserResolver } = await import(
        "../../../src/resolvers/Query/users"
      );
      await mockedInProductionUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(UNAUTHENTICATED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${UNAUTHENTICATED_ERROR.MESSAGE}`,
      );
    }
  });
});
