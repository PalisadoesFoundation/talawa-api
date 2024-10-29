import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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

import type { TestChatType } from "../../helpers/chat";
import { createTestChat } from "../../helpers/chat";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestUserType } from "../../helpers/userAndOrg";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testChat: TestChatType;
vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();
  testUser = resultsArray[0];
  [, , testChat] = await createTestChat();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addUserToGroupChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError message if current user does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUpdateChatArgs = {
        input: {
          name: "New Title",
          _id: testChat?.id,
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { updateChat: updateChatResolver } = await import(
        "../../../src/resolvers/Mutation/updateChat"
      );

      await updateChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`check whether the chat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUpdateChatArgs = {
        input: {
          name: "New Title",
          _id: new Types.ObjectId().toString(),
        },
      };
      const context = {
        userId: testChat?.users[0],
      };
      const { updateChat: updateChatResolver } = await import(
        "../../../src/resolvers/Mutation/updateChat"
      );

      await updateChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`throw userNotAuthorizedError if user is not a member of the chat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationUpdateChatArgs = {
      input: {
        name: "New Title",
        _id: testChat?.id,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const { updateChat: updateChatResolver } = await import(
      "../../../src/resolvers/Mutation/updateChat"
    );
    try {
      await updateChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`updates the chat and returns it`, async () => {
    const args: MutationUpdateChatArgs = {
      input: {
        name: "New Title",
        _id: testChat?.id,
      },
    };
    const context = {
      userId: testChat?.users[0],
    };
    const { updateChat: updateChatResolver } = await import(
      "../../../src/resolvers/Mutation/updateChat"
    );
    const updatedChat = await updateChatResolver?.({}, args, context);
    expect(updatedChat?.name).toEqual(args.input.name);
  });

  it(`updates the chat with image and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationUpdateChatArgs = {
      input: {
        name: "New Title",
        image: "data:image/png;base64,bWVkaWEgY29udGVudA==",
        _id: testChat?.id,
      },
    };
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );
    const context = {
      userId: testChat?.users[0],
    };
    const { updateChat: updateChatResolver } = await import(
      "../../../src/resolvers/Mutation/updateChat"
    );
    await updateChatResolver?.({}, args, context);
    spy.mockRestore();
  });
});
