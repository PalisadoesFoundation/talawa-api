require("dotenv").config();
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
import { connect, disconnect } from "../../src/db";

const testImagePath: string = `${nanoid()}-testImagePath`;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("calls deleteDuplicatedImage and return its callability with one argument as specified in the function", async () => {
    const deleteDuplicatedImage = await import(
      "../../src/lib/utilities/deleteDuplicatedImage"
    );

    const mockedDeleteDuplicatedImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation((_imagePath: any) => {});

    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
  });
});
