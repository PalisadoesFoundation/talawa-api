//ts-ignore
import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { User } from "../../../src/models";
import { usersConnection as usersConnectionResolver } from "../../../src/resolvers/Query/usersConnection";
import type { QueryUsersConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createEventWithRegistrant } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [testUser1, testOrganization] = await createTestUserAndOrganization();
  testUsers = [testUser1, await createTestUser(), await createTestUser()];
  await createEventWithRegistrant(
    testUsers[0]?._id,
    testOrganization?._id,
    true,
  );
  const pledges = await FundraisingCampaignPledge.find({
    _id: new Types.ObjectId(),
  }).lean();
  console.log(pledges);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> usersConnection", () => {
  it(`returns paginated list of all users without any filtering and sorting with first = 0 and skip = 0`, async () => {
    const args: QueryUsersConnectionArgs = {
      where: null,
      orderBy: null,
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );

    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user ?? null,
    );
    // console.log(usersPayload);

    const users = await User.find()
      .limit(0)
      .skip(0)
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { id: testUsers[1].id, firstName: testUsers[1].firstName,
  lastName: testUsers[1].lastName, email: testUsers[1].email,
  appLanguageCode: testUsers[1].appLanguageCode } and sorted by
  args.orderBy === 'id_ASC'`, async () => {
    const where = {
      _id: testUsers[1]?.id,
      firstName: testUsers[1]?.firstName,
      lastName: testUsers[1]?.lastName,
      email: testUsers[1]?.email,
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id: testUsers[1]?.id,
        firstName: testUsers[1]?.firstName,
        lastName: testUsers[1]?.lastName,
        email: testUsers[1]?.email,
      },
      orderBy: "id_ASC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        _id: 1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersConnectionPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { id_not: testUsers[2]._id, firstName_not: testUsers[2].firstName,
  lastName_not: testUsers[2].lastName, email_not: testUsers[2].email,
  appLanguageCode_not: testUsers[2].appLanguageCode } and
  sorted by args.orderBy === 'id_Desc'`, async () => {
    const where = {
      _id: {
        $ne: testUsers[2]?._id,
      },
      firstName: {
        $ne: testUsers[2]?.firstName,
      },
      lastName: {
        $ne: testUsers[2]?.lastName,
      },
      email: {
        $ne: testUsers[2]?.email,
      },
      // appLanguageCode: {
      //   $ne: testUsers[2]?.appLanguageCode,
      // },
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_not: testUsers[2]?._id,
        firstName_not: testUsers[2]?.firstName,
        lastName_not: testUsers[2]?.lastName,
        email_not: testUsers[2]?.email,
        // appLanguageCode_not: testUsers[2]?.appLanguageCode,
      },
      orderBy: "id_DESC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );
    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        _id: -1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { id_in: [testUsers[1].id], firstName_in: [testUsers[1].firstName],
  lastName_in: [testUsers[1].lastName], email_in: [testUsers[1].email],
  appLanguageCode_in: [testUsers[1].appLanguageCode] } and
  sorted by args.orderBy === 'firstName_ASC'`, async () => {
    const where = {
      _id: {
        $in: [testUsers[1]?.id ?? ""],
      },
      firstName: {
        $in: [testUsers[1]?.firstName ?? ""],
      },
      lastName: {
        $in: [testUsers[1]?.lastName ?? ""],
      },
      email: {
        $in: [testUsers[1]?.email ?? ""],
      },
      // appLanguageCode: {
      //   $in: [testUsers[1]?.appLanguageCode],
      // },
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_in: [testUsers[1]?.id],
        firstName_in: [testUsers[1]?.firstName ?? ""],
        lastName_in: [testUsers[1]?.lastName ?? ""],
        email_in: [testUsers[1]?.email],
        // appLanguageCode_in: [testUsers[1]!.appLanguageCode],
      },
      orderBy: "firstName_ASC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        firstName: 1,
      })
      .select(["-password"])

      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersConnectionPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { id_not_in: [testUsers[2]._id], firstName_not_in: [testUsers[2].firstName],
  lastName_not_in: [testUsers[2].lastName], email_not_in: [testUsers[2].email],
  appLanguageCode_not_in: [testUsers[2].appLanguageCode] } and
  sorted by args.orderBy === 'firstName_DESC'`, async () => {
    const where = {
      _id: {
        $nin: [testUsers[2]?._id ?? ""],
      },
      firstName: {
        $nin: [testUsers[2]?.firstName ?? ""],
      },
      lastName: {
        $nin: [testUsers[2]?.lastName ?? ""],
      },
      email: {
        $nin: [testUsers[2]?.email ?? ""],
      },
      // appLanguageCode: {
      //   $nin: [testUsers[2]!.appLanguageCode],
      // },
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        id_not_in: [testUsers[2]?._id],
        firstName_not_in: [testUsers[2]?.firstName ?? ""],
        lastName_not_in: [testUsers[2]?.lastName ?? ""],
        email_not_in: [testUsers[2]?.email ?? ""],
        // appLanguageCode_not_in: [testUsers[2]?.appLanguageCode],
      },
      orderBy: "firstName_DESC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );
    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        firstName: -1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { firstName_contains: testUsers[1].firstName,
  lastName_contains: testUsers[1].lastName, email_contains: testUsers[1].email,
  appLanguageCode_contains: testUsers[1].appLanguageCode } and
  sorted by args.orderBy === 'lastName_ASC'`, async () => {
    const where = {
      firstName: {
        $regex: testUsers[1]?.firstName,
        $options: "i",
      },
      lastName: {
        $regex: testUsers[1]?.lastName,
        $options: "i",
      },
      email: {
        $regex: testUsers[1]?.email,
        $options: "i",
      },
      // appLanguageCode: {
      //   $regex: testUsers[1]?.appLanguageCode,
      //   $options: "i",
      // },
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        firstName_contains: testUsers[1]?.firstName,
        lastName_contains: testUsers[1]?.lastName,
        email_contains: testUsers[1]?.email,
        // appLanguageCode_contains: testUsers[1]?.appLanguageCode,
      },
      orderBy: "lastName_ASC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        lastName: 1,
      })
      .select(["-password"])

      .populate("joinedOrganizations")
      .populate("registeredEvents")

      .lean();

    expect(usersConnectionPayload).toEqual(users);
  });

  it(`returns paginated list of users filtered by
  args.where === { firstName_starts_with: testUsers[1].firstName,
  lastName_starts_with: testUsers[1].lastName, email_starts_with: testUsers[1].email,
  appLanguageCode_starts_with: testUsers[1].appLanguageCode } and
  sorted by args.orderBy === 'lastName_DESC'`, async () => {
    const where = {
      firstName: new RegExp("^" + testUsers[1]?.firstName),
      lastName: new RegExp("^" + testUsers[1]?.lastName),
      email: new RegExp("^" + testUsers[1]?.email),
      // appLanguageCode: new RegExp("^" + testUsers[1]?.appLanguageCode),
    };

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: {
        firstName_starts_with: testUsers[1]?.firstName,
        lastName_starts_with: testUsers[1]?.lastName,
        email_starts_with: testUsers[1]?.email,
        // appLanguageCode_starts_with: testUsers[1]?.appLanguageCode,
      },
      orderBy: "lastName_DESC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        lastName: -1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersConnectionPayload).toEqual(users);
  });

  it(`returns paginated list of users
  sorted by args.orderBy === 'email_ASC'`, async () => {
    const where = {};

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: null,
      orderBy: "email_ASC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );
    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        email: 1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });

  it(`returns paginated list of users
  sorted by args.orderBy === 'email_DESC'`, async () => {
    const where = {};

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: null,
      orderBy: "email_DESC",
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );
    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort({
        email: -1,
      })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });

  it(`returns paginated list of users without sorting if orderBy === null`, async () => {
    const where = {};

    const sort = {};

    const args: QueryUsersConnectionArgs = {
      first: 2,
      skip: 1,
      where: null,
      orderBy: null,
    };

    const usersConnectionPayload = await usersConnectionResolver?.(
      {},
      args,
      {},
    );
    const usersPayload = usersConnectionPayload?.map(
      // @ts-expect-error-ignore
      (userConnection) => userConnection?.user,
    );

    const users = await User.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(usersPayload).toEqual(users);
  });
});
