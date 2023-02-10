import "dotenv/config";
import { Types } from "mongoose";
import { Organization } from "../../../src/models";
import { MutationAdminRemovePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { adminRemovePost as adminRemovePostResolver } from "../../../src/resolvers/Mutation/adminRemovePost";
import {
  ORGANIZATION_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";
import { testPostType, createTestPost } from "../../helpers/posts";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testPost: testPostType;

beforeAll(async () => {
  await connect();
  const resultsArray = await createTestPost();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testPost = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> adminRemovePost", () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationAdminRemovePostArgs = {
        organizationId: Types.ObjectId().toString(),
        postId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization!.id,
        postId: testPost!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if for user with _id === context.userId is not an
  admin of orgnanization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization!.id,
        postId: testPost!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.postId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $push: {
            admins: testUser!._id,
          },
        }
      );

      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization!.id,
        postId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND_MESSAGE);
    }
  });

  it(`deletes the post and returns it`, async () => {
    const args: MutationAdminRemovePostArgs = {
      organizationId: testOrganization!.id,
      postId: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const adminRemovePostPayload = await adminRemovePostResolver?.(
      {},
      args,
      context
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["posts"])
      .lean();

    expect(updatedTestOrganization?.posts).toEqual([]);

    expect(adminRemovePostPayload).toEqual(testPost!.toObject());
  });
});
