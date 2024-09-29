import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";
import { installMinio } from "../../../../src/setup/installMinio";
import type { ClientRequest, IncomingMessage } from "http";

const mockMinioUrl =
  "https://dl.min.io/server/minio/release/windows-amd64/minio.exe";

vi.mock("https", () => ({
  get: vi.fn(
    (
      url: string | URL | https.RequestOptions,
      options?: https.RequestOptions | ((res: IncomingMessage) => void),
      callback?: (res: IncomingMessage) => void,
    ): ClientRequest => {
      const mockResponse = {
        pipe: vi.fn(),
      } as unknown as IncomingMessage;

      if (typeof options === "function") {
        options(mockResponse);
      } else if (callback) {
        callback(mockResponse);
      }

      return {
        on: vi.fn().mockReturnThis(),
      } as unknown as ClientRequest;
    },
  ),
}));

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("linux"),
  homedir: vi.fn(),
}));
const mockWriteStream = {
  close: vi.fn().mockImplementation((callback) => callback()),
  on: vi.fn().mockImplementation((event, handler) => {
    if (event === "finish") {
      // Immediately call the 'finish' handler
      handler();
    }
    return mockWriteStream;
  }),
};

vi.mocked(fs.createWriteStream).mockReturnValue(
  mockWriteStream as unknown as fs.WriteStream,
);

vi.mock("fs");
vi.mock("path");
vi.mock("dotenv");
vi.mock("../../../../src/setup/setPathEnvVar", () => ({
  setPathEnvVar: vi.fn(),
}));
vi.mock("../../../../src/setup/getMinioBinaryUrl", () => ({
  getMinioBinaryUrl: vi.fn(),
}));
vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    platform: vi.fn().mockReturnValue("win32"),
    homedir: vi.fn().mockReturnValue("/mock/home"),
  };
});

describe("installMinio", () => {
  const mockMinioPath = "/mock/home/.minio/minio.exe";

  beforeEach(() => {
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(getMinioBinaryUrl).mockReturnValue(mockMinioUrl);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should download and save the Minio binary", async () => {
    const mockWriteStream = {
      close: vi.fn().mockImplementation((callback) => callback()),
      on: vi.fn().mockImplementation((event, handler) => {
        if (event === "finish") {
          handler();
        }
        return mockWriteStream;
      }),
    };

    vi.mocked(fs.createWriteStream).mockReturnValue(
      mockWriteStream as unknown as fs.WriteStream,
    );

    vi.mocked(https.get).mockImplementation((_url, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      const mockResponse = {
        pipe: vi.fn().mockReturnValue(mockWriteStream),
      };
      if (typeof cb === "function") {
        cb(mockResponse as unknown as IncomingMessage);
      }
      return {
        on: vi.fn().mockReturnThis(),
      } as never;
    });

    await installMinio();

    expect(fs.createWriteStream).toHaveBeenCalledWith(mockMinioPath);
  });
});
