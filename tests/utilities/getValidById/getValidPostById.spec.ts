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
import { POST_NOT_FOUND_ERROR } from "../../../src/constants";
import { createTestPost, TestPostType } from "../../helpers/posts";

let testPost: TestPostType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgPost = await createTestPost();
  testPost = userOrgPost[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidPostById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no post exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidPostById } = await import("../../../src/utilities");

      await getValidPostById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(POST_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid Post with matching id", async () => {
    const { getValidPostById } = await import("../../../src/utilities");
    const post = await getValidPostById(testPost?._id);

    expect(post).toEqual(testPost?.toObject());
  });
});
