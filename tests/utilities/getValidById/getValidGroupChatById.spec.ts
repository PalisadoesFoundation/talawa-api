import mongoose, { Types } from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connect, disconnect } from "../../helpers/db";
import { CHAT_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  createTestGroupChat,
  TestGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgGroupChat = await createTestGroupChat();
  testGroupChat = userOrgGroupChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidGroupChatById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no group chat exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidGroupChatById } = await import("../../../src/utilities");

      await getValidGroupChatById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${CHAT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid GroupChat with matching id", async () => {
    const { getValidGroupChatById } = await import("../../../src/utilities");
    const groupChat = await getValidGroupChatById(testGroupChat?._id);

    expect(groupChat).toEqual(testGroupChat?.toObject());
  });
});
