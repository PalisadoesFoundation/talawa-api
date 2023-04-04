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
import { EVENT_NOT_FOUND_ERROR } from "../../../src/constants";
import { createTestEvent, TestEventType } from "../../helpers/events";

let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgEvent = await createTestEvent();
  testEvent = userOrgEvent[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidEventById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no event exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidEventById } = await import("../../../src/utilities");

      await getValidEventById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid Event with matching id", async () => {
    const { getValidEventById } = await import("../../../src/utilities");
    const event = await getValidEventById(testEvent?._id);

    expect(event).toEqual(testEvent?.toObject());
  });
});
