import "dotenv/config";
import { childTags as childTagsResolver } from "../../../src/resolvers/UserTag/childTags";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTwoLevelTagsWithOrg, testUserTagType } from "../../helpers/tags";
import { OrganizationTagUser } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testRootTag: testUserTagType,
  testChildTag1: testUserTagType,
  testChildTag2: testUserTagType;
let childTags: testUserTagType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testRootTag, testChildTag1, testChildTag2]] =
    await createTwoLevelTagsWithOrg();

  childTags = await OrganizationTagUser.find({
    parentTagId: testRootTag!._id,
  }).lean();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Tag -> childTags", () => {
  it(`returns all the child tags if no args are provided`, async () => {
    const parent = testRootTag!.toObject();

    const payload = await childTagsResolver?.(parent, {}, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testChildTag1!._id);
    expect(payload!.pageInfo.endCursor).toEqual(testChildTag2!._id);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(childTags);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual([
      testChildTag1!._id,
      testChildTag2!._id,
    ]);
  });

  it(`returns the correct child tags when after argument is provided`, async () => {
    const parent = testRootTag!.toObject();
    const args = {
      after: testChildTag1!._id,
    };
    const payload = await childTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testChildTag2!._id);
    expect(payload!.pageInfo.endCursor).toEqual(testChildTag2!._id);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(1);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual([childTags[1]]);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual([
      testChildTag2!._id,
    ]);
  });

  it(`returns the correct child tags when before argument is provided`, async () => {
    const parent = testRootTag!.toObject();
    const args = {
      before: testChildTag2!._id,
    };
    const payload = await childTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testChildTag1!._id);
    expect(payload!.pageInfo.endCursor).toEqual(testChildTag2!._id);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(childTags);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual([
      testChildTag1!._id,
      testChildTag2!._id,
    ]);
  });

  it(`returns the correct child tags when first argument is provided`, async () => {
    const parent = testRootTag!.toObject();
    const args = {
      first: 1,
    };
    const payload = await childTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(true);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testChildTag1!._id);
    expect(payload!.pageInfo.endCursor).toEqual(testChildTag1!._id);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(1);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual([childTags[0]]);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual([
      testChildTag1!._id,
    ]);
  });

  it(`returns the correct child tags when last argument is provided`, async () => {
    const parent = testRootTag!.toObject();
    const args = {
      last: 1,
    };
    const payload = await childTagsResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
    expect(payload!.pageInfo.startCursor).toEqual(testChildTag2!._id);
    expect(payload!.pageInfo.endCursor).toEqual(testChildTag2!._id);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(1);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual([childTags[1]]);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual([
      testChildTag2!._id,
    ]);
  });

  it(`returns the correct response when no edges exist`, async () => {
    const parent = testChildTag1!.toObject();

    const payload = await childTagsResolver?.(parent, {}, {});

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
