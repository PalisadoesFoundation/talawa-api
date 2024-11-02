import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { VolunteerRank } from "../../../src/types/generatedGraphQLTypes";
import type { TestUserType } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import { getVolunteerRanks } from "../../../src/resolvers/Query/getVolunteerRanks";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser1: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [organization, , user1, user2] = await createVolunteerAndActions();
  testOrganization = organization;
  testUser1 = user1;
  testUser2 = user2;
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getVolunteerRanks", () => {
  it(`getVolunteerRanks for allTime, descending, no limit/name`, async () => {
    const volunteerRanks = (await getVolunteerRanks?.(
      {},
      {
        orgId: testOrganization?._id,
        where: {
          timeFrame: "allTime",
          orderBy: "hours_DESC",
        },
      },
      {},
    )) as unknown as VolunteerRank[];
    expect(volunteerRanks[0].hoursVolunteered).toEqual(10);
    expect(volunteerRanks[0].user._id).toEqual(testUser1?._id);
    expect(volunteerRanks[0].rank).toEqual(1);
    expect(volunteerRanks[1].hoursVolunteered).toEqual(8);
    expect(volunteerRanks[1].user._id).toEqual(testUser2?._id);
    expect(volunteerRanks[1].rank).toEqual(2);
  });

  it(`getVolunteerRanks for weekly, descending, limit, no name`, async () => {
    const volunteerRanks = (await getVolunteerRanks?.(
      {},
      {
        orgId: testOrganization?._id,
        where: {
          timeFrame: "weekly",
          orderBy: "hours_DESC",
          limit: 1,
        },
      },
      {},
    )) as unknown as VolunteerRank[];
    expect(volunteerRanks[0].hoursVolunteered).toEqual(2);
    expect(volunteerRanks[0].user._id).toEqual(testUser1?._id);
    expect(volunteerRanks[0].rank).toEqual(1);
  });

  it(`getVolunteerRanks for monthly, descending, name, no limit`, async () => {
    const volunteerRanks = (await getVolunteerRanks?.(
      {},
      {
        orgId: testOrganization?._id,
        where: {
          timeFrame: "monthly",
          orderBy: "hours_ASC",
          nameContains: testUser1?.firstName,
        },
      },
      {},
    )) as unknown as VolunteerRank[];
    expect(volunteerRanks[0].hoursVolunteered).toEqual(2);
    expect(volunteerRanks[0].user._id).toEqual(testUser1?._id);
    expect(volunteerRanks[0].rank).toEqual(1);
  });

  it(`getVolunteerRanks for yearly, descending, no name/limit`, async () => {
    const volunteerRanks = (await getVolunteerRanks?.(
      {},
      {
        orgId: testOrganization?._id,
        where: {
          timeFrame: "yearly",
          orderBy: "hours_DESC",
        },
      },
      {},
    )) as unknown as VolunteerRank[];
    expect(volunteerRanks[0].hoursVolunteered).toEqual(8);
    expect(volunteerRanks[0].user._id).toEqual(testUser1?._id);
    expect(volunteerRanks[0].rank).toEqual(1);
  });
});
