import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceMessageChat } from "../../../src/models";
import { AppUserProfile, User } from "../../../src/models";
import type { MutationCreateMessageChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUsers: TestUserType[];
// let testAppUserProfile: TestAppUserProfileType[];
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    },
  ]);
  const appUserProfiles = testUsers.map((user) => ({
    userId: user?._id,
  }));
  await AppUserProfile.insertMany(appUserProfiles);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createMessageChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === args.data.receiver`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: "",
          receiver: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it(`throws user not found error if no user exist with id==context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: "",
          receiver: testUsers[1]?.id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log(error);
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it("throws error if receiver user does not have appProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: "",
          receiver: newUser.id,
        },
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
  it("throws error if sender user does not have appProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: "",
          receiver: testUsers[1]?.id,
        },
      };

      const context = {
        userId: newUser.id,
      };

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`creates the organization and returns it`, async () => {
    const args: MutationCreateMessageChatArgs = {
      data: {
        message: "message",
        receiver: testUsers[1]?.id,
      },
    };

    const pubsub = {
      publish: (
        _action: "CHAT_CHANNEL",
        _payload: {
          directMessageChat: InterfaceMessageChat;
        },
      ): {
        _action: string;
        _payload: { directMessageChat: InterfaceMessageChat };
      } => {
        return { _action, _payload };
      },
    };

    const context = {
      userId: testUsers[0]?.id,
      pubsub,
    };

    const { createMessageChat: createMessageChatResolver } = await import(
      "../../../src/resolvers/Mutation/createMessageChat"
    );
    const createMessageChatPayload = await createMessageChatResolver?.(
      {},
      args,
      context,
    );

    expect(createMessageChatPayload).toEqual(
      expect.objectContaining({
        sender: testUsers[0]?._id,
        receiver: testUsers[1]?._id,
        message: "message",
        languageBarrier: false,
      }),
    );
  });
});
