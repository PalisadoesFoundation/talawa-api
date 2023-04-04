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
import { TASK_NOT_FOUND_ERROR } from "../../../src/constants";
import { createTestTask, TestTaskType } from "../../helpers/task";
import { createTestEvent } from "../../helpers/events";

let testTask: TestTaskType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgEvent = await createTestEvent();
  testTask = await createTestTask(userOrgEvent[2]?._id, userOrgEvent[0]?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidTaskById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no task exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidTaskById } = await import("../../../src/utilities");

      await getValidTaskById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${TASK_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(TASK_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid Task with matching id", async () => {
    const { getValidTaskById } = await import("../../../src/utilities");
    const post = await getValidTaskById(testTask?._id);

    expect(post).toEqual(testTask?.toObject());
  });
});
