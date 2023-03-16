import "dotenv/config";
import { tagsAssignedWith as tagsAssignedWithResolver } from "../../../src/resolvers/User/tagsAssignedWith";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTagsAndAssignToUser } from "../../helpers/tags";
import {
  Interface_OrganizationTagUser,
  TagUser,
  Interface_TagUser,
} from "../../../src/models";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;

let tagsAssignedWith: any;

let testUser: testUserType;
let testOrganization: testOrganizationType;

let testTagIds: string[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  [testUser, testOrganization] = await createTagsAndAssignToUser(5);

  tagsAssignedWith = await TagUser.find({
    userId: testUser!._id,
  })
    .populate("tagId")
    .sort({ _id: 1 })
    .lean();

  tagsAssignedWith = tagsAssignedWith
    .map((tagAssign: Interface_TagUser) => tagAssign!.tagId)
    .filter(
      (tag: Interface_OrganizationTagUser) =>
        tag.organizationId.toString() === testOrganization!._id.toString()
    );

  testTagIds = tagsAssignedWith.map((tag: Interface_TagUser) => tag!._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> User -> tagsAssignedWith", () => {
  it(`returns all the tags if no args are provided`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: testOrganization!._id,
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(5);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge.node)).toEqual(tagsAssignedWith);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(testTagIds);
  });

  it(`returns the correct tags when after argument is provided`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: testOrganization!._id,
      after: testTagIds[2],
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[3]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      tagsAssignedWith.slice(-2)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(-2)
    );
  });

  it(`returns the correct tags when before argument is provided`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: testOrganization!._id,
      before: testTagIds[2],
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(true);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[1]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(2);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      tagsAssignedWith.slice(0, 2)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(0, 2)
    );
  });

  it(`returns the correct child tags when first argument is provided`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: testOrganization!._id,
      first: 3,
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(true);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[0]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[2]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(3);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      tagsAssignedWith.slice(0, 3)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(0, 3)
    );
  });

  it(`returns the correct child tags when last argument is provided`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: testOrganization!._id,
      last: 3,
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

    // Testing the pageInfo object
    expect(payload!.pageInfo.hasNextPage).toEqual(false);
    expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
    expect(payload!.pageInfo.startCursor).toEqual(testTagIds[2]);
    expect(payload!.pageInfo.endCursor).toEqual(testTagIds[4]);

    // Testing the edges object
    expect(payload!.edges!.length).toEqual(3);
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
      tagsAssignedWith.slice(-3)
    );
    // @ts-ignore
    expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
      testTagIds.slice(-3)
    );
  });

  it(`returns the correct response when no edges exist`, async () => {
    const parent = testUser!.toObject();
    const args = {
      organizationId: "anyRandomID",
    };

    const payload = await tagsAssignedWithResolver?.(parent, args, {});

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
