import "dotenv/config";
import { groups as groupsResolver } from "../../../src/resolvers/Query/groups";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { Group } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroup } from "../../helpers/group";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await createTestGroup();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> groups", () => {
  it(`returns list of all existing groups`, async () => {
    const groupsPayload = await groupsResolver?.({}, {}, {});

    const groups = await Group.find().lean();

    expect(groupsPayload).toEqual(groups);
  });
});
