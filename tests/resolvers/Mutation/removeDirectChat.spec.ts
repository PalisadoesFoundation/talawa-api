import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Interface_DirectChat,
  DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import { MutationRemoveDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testDirectChat:
  | (Interface_DirectChat & Document<any, any, Interface_DirectChat>)
  | null;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testDirectChat = await DirectChat.create({
    users: [testUser._id],
    creator: testUser._id,
    organization: testOrganization._id,
  });

  const testDirectChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: testUser._id,
    receiver: testUser._id,
    messageContent: "messageContent",
    createdAt: new Date(),
  });

  testDirectChat = await DirectChat.findOneAndUpdate(
    {
      _id: testDirectChat._id,
    },
    {
      $push: {
        messages: testDirectChatMessage._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect();
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
        userId: testUser.id,
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
        userId: testUser.id,
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
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
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
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
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
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveDirectChatArgs = {
        chatId: testDirectChat!.id,
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the directChat with _id === args.chatId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $push: {
          admins: testUser._id,
        },
      }
    );

    const args: MutationRemoveDirectChatArgs = {
      chatId: testDirectChat!.id,
      organizationId: testOrganization.id,
    };

    const context = {
      userId: testUser.id,
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
