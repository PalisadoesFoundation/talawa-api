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
import { COMMENT_NOT_FOUND_ERROR } from "../../../src/constants";
import { createPostwithComment, TestCommentType } from "../../helpers/posts";

let testComment: TestCommentType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgPostComment = await createPostwithComment();
  testComment = userOrgPostComment[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidCommentById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no comment exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidCommentById } = await import("../../../src/utilities");

      await getValidCommentById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${COMMENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(COMMENT_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid Comment with matching id", async () => {
    const { getValidCommentById } = await import("../../../src/utilities");
    const comment = await getValidCommentById(testComment?._id);

    expect(comment).toEqual(testComment?.toObject());
  });
});
