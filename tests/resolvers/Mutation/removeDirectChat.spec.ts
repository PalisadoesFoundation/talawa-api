import "dotenv/config";
import { Types } from "mongoose";
import {
  Organization,
  DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import { MutationRemoveDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_ADMIN,
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
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import {
  createTestDirectChat,
  testDirectChatType,
} from "../../helpers/directChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testDirectChat: testDirectChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestDirectChat();
  testUser = temp[0];
  testOrganization = temp[1];

  testDirectChat = await DirectChat.create({
    users: [testUser!._id],
    creator: testUser!._id,
    organization: testOrganization!._id,
  });

  const testDirectChatMessage = temp[2];

  testDirectChat = await DirectChat.findOneAndUpdate(
    {
      _id: testDirectChat._id,
    },
    {
      $push: {
        messages: testDirectChatMessage!._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removeDirectChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId and IN_PRODUCTION === false`, async () => {
    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: "",
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: "",
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no directChat exists with _id === args.chatId and IN_PRODUCTION === false`, async () => {
    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: Types.ObjectId().toString(),
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no directChat exists with _id === args.chatId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: Types.ObjectId().toString(),
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(CHAT_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${CHAT_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

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

      const args: MutationRemoveDirectChatArgs = {
        chatId: testDirectChat!.id,
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.message}`
      );

      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.message);
    }
  });

  it(`deletes the directChat with _id === args.chatId`, async () => {
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

    const args: MutationRemoveDirectChatArgs = {
      chatId: testDirectChat!.id,
      organizationId: testOrganization!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const { removeDirectChat: removeDirectChatResolver } = await import(
      "../../../src/resolvers/Mutation/removeDirectChat"
    );
    const removeDirectChatPayload = await removeDirectChatResolver?.(
      {},
      args,
      context
    );

    expect(removeDirectChatPayload).toEqual(testDirectChat?.toObject());

    const testDeletedDirectChatMessages = await DirectChatMessage.find({
      directChatMessageBelongsTo: testDirectChat!._id,
    }).lean();

    expect(testDeletedDirectChatMessages).toEqual([]);
  });
});
