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
  createTestDirectChat,
  TestDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: TestDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgDirectChat = await createTestDirectChat();
  testDirectChat = userOrgDirectChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidDirectChatById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no direct chat exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidDirectChatById } = await import("../../../src/utilities");

      await getValidDirectChatById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${CHAT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid DirectChat with matching id", async () => {
    const { getValidDirectChatById } = await import("../../../src/utilities");
    const directChat = await getValidDirectChatById(testDirectChat?._id);

    expect(directChat).toEqual(testDirectChat?.toObject());
  });
});
