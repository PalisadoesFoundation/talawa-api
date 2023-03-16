import "dotenv/config";
import { userTags as userTagsResolver } from "../../../src/resolvers/Organization/userTags";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createRootTagsWithOrg, testUserTagType } from "../../helpers/tags";
import { OrganizationTagUser } from "../../../src/models";
import {
  createTestUserAndOrganization,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;

let orgTags: any;

let testOrganization: testOrganizationType;
let randomTestOrganization: testOrganizationType;
let testTagIds: string[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  [, testOrganization] = await createRootTagsWithOrg(5);
  [, randomTestOrganization] = await createTestUserAndOrganization();

  orgTags = await OrganizationTagUser.find({
    organizationId: testOrganization!._id,
    parentTagId: null,
  })
    .sort({ _id: 1 })
    .lean();

  testTagIds = orgTags.map((tag: testUserTagType) => tag!._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Organization -> orgTags", () => {
  it(`returns all the tags if no args are provided`, async () => {
    const parent = testOrganization!.toObject();
    const args = {};

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(5);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge.node)).toEqual(orgTags);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(testTagIds);
  });

  it(`returns the correct tags when after argument is provided`, async () => {
    const parent = testOrganization!.toObject();
    const args = {
      after: testTagIds[2],
    };

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[3]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      orgTags.slice(-2)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(-2)
    );
  });

  it(`returns the correct tags when before argument is provided`, async () => {
    const parent = testOrganization!.toObject();
    const args = {
      before: testTagIds[2],
    };

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(true);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[1]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      orgTags.slice(0, 2)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(0, 2)
    );
  });

  it(`returns the correct child tags when first argument is provided`, async () => {
    const parent = testOrganization!.toObject();
    const args = {
      first: 3,
    };

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(true);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[2]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(3);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      orgTags.slice(0, 3)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(0, 3)
    );
  });

  it(`returns the correct child tags when last argument is provided`, async () => {
    const parent = testOrganization!.toObject();
    const args = {
      last: 3,
    };

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[2]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(3);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      orgTags.slice(-3)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(-3)
    );
  });

  it(`returns the correct response when no edges exist`, async () => {
    const parent = randomTestOrganization!.toObject();
    const args = {};

    const payload = await userTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(null);
    expect(payload!.pageInfo.endCursor).toEqual(null);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(0);
    expect(payload!.edges!).toEqual([]);
  });
});
