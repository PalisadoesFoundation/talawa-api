import "dotenv/config";
import { groups as groupsResolver } from "../../../src/resolvers/Query/groups";
import { connect, disconnect } from "../../../src/db";
import { User, Organization, Group } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroup } from "../../helpers/group";

beforeAll(async () => {
  await connect();
  const [testUser, testOrganization, testGroup] = await createTestGroup();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> groups", () => {
  it(`returns list of all existing groups`, async () => {
    const groupsPayload = await groupsResolver?.({}, {}, {});

    const groups = await Group.find().lean();

    expect(groupsPayload).toEqual(groups);
  });
});
