import "dotenv/config";
import { Types } from "mongoose";
import { Organization, GroupChat } from "../../../src/models";
import { MutationAddUserToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import {
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
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
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";
import {
  testGroupChatType,
  createTestGroupChat,
} from "../../helpers/groupChat";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testGroupChat: testGroupChatType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultArray = await createTestGroupChat();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> addUserToGroupChat", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    const args: MutationAddUserToGroupChatArgs = {
      chatId: Types.ObjectId().toString(),
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );

    expect(async () => {
      await addUserToGroupChat?.({}, args, context);
    }).rejects.toThrowError(CHAT_NOT_FOUND);
  });

  it(`throws NotFoundError if no groupChat exists with _id === args.chatId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
        userId: testUser!.id,
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
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(CHAT_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for groupChat with _id === args.chatId`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat!._id,
      },
      {
        $set: {
          organization: Types.ObjectId().toString(),
        },
      }
    );

    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };
    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    expect(async () => {
      await addUserToGroupChat?.({}, args, context);
    }).rejects.toThrowError(ORGANIZATION_NOT_FOUND);
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for groupChat with _id === args.chatId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: testUser!.id,
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
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of organization with _id === groupChat.organization for groupChat
  with _id === args.chatId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

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

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
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

    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat!.id,
      userId: Types.ObjectId().toString(),
    };

    const context = {
      userId: testUser!.id,
    };
    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    expect(async () => {
      await addUserToGroupChat?.({}, args, context);
    }).rejects.toThrowError(USER_NOT_FOUND);
  });

  it(`throws NotFoundError if no user exists with _id === args.userId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
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

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: Types.ObjectId().toString(),
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
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === args.userId is already a member 
  of groupChat with _id === args.chatId`, async () => {
    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };
    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );

    expect(async () => {
      await addUserToGroupChat?.({}, args, context);
    }).rejects.toThrowError(USER_ALREADY_MEMBER);
  });

  it(`throws ConflictError if user with _id === args.userId is already a member 
  of groupChat with _id === args.chatId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: testUser!.id,
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
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_MESSAGE);
      expect(error.message).toEqual(USER_ALREADY_MEMBER_MESSAGE);
    }
  });

  it(`add the groupChat with _id === args.chatId and returns it`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat!._id,
      },
      {
        $set: {
          users: [],
        },
      }
    );

    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };
    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    const addUserToGroupChatPayload = await addUserToGroupChat?.(
      {},
      args,
      context
    );
    expect(addUserToGroupChatPayload?._id).toEqual(testGroupChat!._id);
    expect(addUserToGroupChatPayload?.users).toEqual([testUser!._id]);
  });
});
