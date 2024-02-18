import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  InterfaceOrganization,
  InterfaceComment,
  InterfacePost,
  InterfaceActionItemCategory,
  InterfaceActionItem,
} from "../../../src/models";
import {
  User,
  Organization,
  Post,
  Comment,
  MembershipRequest,
  ActionItemCategory,
  ActionItem,
} from "../../../src/models";
import type { MutationRemoveOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { removeOrganization as removeOrganizationResolver } from "../../../src/resolvers/Mutation/removeOrganization";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { createTestUserFunc } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
/* eslint-disable */
let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];
let testOrganization: InterfaceOrganization &
  Document<any, any, InterfaceOrganization>;
let testPost: InterfacePost & Document<any, any, InterfacePost>;
let testComment: InterfaceComment & Document<any, any, InterfaceComment>;
let testCategory: InterfaceActionItemCategory & Document;
let testActionItem: InterfaceActionItem & Document;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2];

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    address: {
      countryCode: `US`,
      city: `SAMPLE`,
      dependentLocality: "TEST",
      line1: "TEST",
      postalCode: "110001",
      sortingCode: "ABC-123",
      state: "Delhi",
    },
    isPublic: true,
    creatorId: testUsers[0]?._id,
    admins: [testUsers[0]?._id],
    members: [testUsers[1]?._id],
    blockedUsers: [testUsers[0]?._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUsers[0]?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
        organizationsBlockedBy: [testOrganization._id],
      },
    },
  );

  await User.updateOne(
    {
      _id: testUsers[1]?._id,
    },
    {
      $set: {
        joinedOrganizations: [testOrganization._id],
      },
    },
  );

  const testMembershipRequest = await MembershipRequest.create({
    organization: testOrganization._id,
    user: testUsers[0]?._id,
  });

  await User.updateOne(
    {
      _id: testUsers[0]?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
  );

  testPost = await Post.create({
    text: "text",
    creatorId: testUsers[0]?._id,
    organization: testOrganization._id,
  });

  testCategory = await ActionItemCategory.create({
    creatorId: testUsers[0]?._id,
    organizationId: testOrganization?._id,
    name: "Default",
  });

  testActionItem = await ActionItem.create({
    creatorId: testUsers[0]?._id,
    assigneeId: testUsers[1]?._id,
    assignerId: testUsers[0]?._id,
    actionItemCategoryId: testCategory?._id,
  });

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
        posts: testPost._id,
      },
    },
  );

  testComment = await Comment.create({
    text: "text",
    creatorId: testUsers[0]?._id,
    postId: testPost._id,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $inc: {
        commentCount: 1,
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeOrganization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeOrganization: removeOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/removeOrganization"
      );

      await removeOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { removeOrganization: removeOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/removeOrganization"
      );

      await removeOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws User is not SUPERADMIN error if current user with _id === context.userId
  is not a SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            creatorId: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationRemoveOrganizationArgs = {
        id: testOrganization.id,
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { removeOrganization: removeOrganizationResolverAdminError } =
        await import("../../../src/resolvers/Mutation/removeOrganization");

      await removeOrganizationResolverAdminError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`removes the organization with no image and returns the updated user's object with _id === context.userId`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          creatorId: testUsers[0]?._id,
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    await User.updateOne(
      {
        _id: testUsers[0]?.id,
      },
      {
        $set: {
          adminApproved: true,
          userType: "SUPERADMIN",
        },
      },
    );

    const args: MutationRemoveOrganizationArgs = {
      id: testOrganization._id,
    };

    const context = {
      userId: testUsers[0]?._id,
    };

    const removeOrganizationPayload = await removeOrganizationResolver?.(
      {},
      args,
      context,
    );

    const updatedTestUser = await User.findOne({
      _id: testUsers[0]?._id,
    })
      .select(["-password"])
      .lean();

    expect(removeOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestUser1 = await User.findOne({
      _id: testUsers[1]?._id,
    })
      .select(["joinedOrganizations"])
      .lean();

    expect(updatedTestUser1?.joinedOrganizations).toEqual([]);

    const deletedMembershipRequests = await MembershipRequest.find({
      organization: testOrganization._id,
    }).lean();

    const deletedTestPosts = await Post.find({
      _id: testPost._id,
    }).lean();

    const deletedTestComments = await Comment.find({
      _id: testComment._id,
    }).lean();

    const deletedTestCategories = await ActionItemCategory.find({
      organizationId: testOrganization?._id,
    }).lean();

    const deteledTestActionItems = await ActionItem.find({
      _id: testActionItem?._id,
    });

    expect(deletedMembershipRequests).toEqual([]);

    expect(deletedTestPosts).toEqual([]);

    expect(deletedTestComments).toEqual([]);

    expect(deletedTestCategories).toEqual([]);

    expect(deteledTestActionItems).toEqual([]);
  });

  it(`removes the organization with image and returns the updated user's object with _id === context.userId`, async () => {
    const newTestOrganization = await Organization.create({
      name: "name",
      description: "description",
      address: {
        countryCode: `US`,
        city: `SAMPLE`,
        dependentLocality: "TEST",
        line1: "TEST",
        postalCode: "110001",
        sortingCode: "ABC-123",
        state: "Delhi",
      },
      isPublic: true,
      creatorId: testUsers[0]?._id,
      admins: [testUsers[0]?._id],
      members: [testUsers[1]?._id],
      blockedUsers: [testUsers[0]?._id],
      image: "images/fake-image-path.png",
      visibleInSearch: true,
    });

    const args: MutationRemoveOrganizationArgs = {
      id: newTestOrganization._id,
    };

    const context = {
      userId: testUsers[0]?._id,
    };

    const deletePreviousImage = await import(
      "../../../src/utilities/encodedImageStorage/deletePreviousImage"
    );
    const deleteImageSpy = vi
      .spyOn(deletePreviousImage, "deletePreviousImage")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    const updatedTestUser = await User.findOne({
      _id: testUsers[0]?._id,
    })
      .select(["-password"])
      .lean();

    const { removeOrganization: removeOrganizationResolver } = await import(
      "../../../src/resolvers/Mutation/removeOrganization"
    );

    const removeOrganizationPayload = await removeOrganizationResolver?.(
      {},
      args,
      context,
    );

    expect(removeOrganizationPayload).toEqual({
      ...updatedTestUser,
      updatedAt: expect.anything(),
    });
    expect(deleteImageSpy).toBeCalledWith("images/fake-image-path.png");
  });
});
