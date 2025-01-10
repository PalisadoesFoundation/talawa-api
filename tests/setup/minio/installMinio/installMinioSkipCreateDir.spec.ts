// installMinioSkipCreateDir.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import type { IncomingMessage } from "http";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";
import { installMinio } from "../../../../src/setup/installMinio";
import { setPathEnvVar } from "../../../../src/setup/setPathEnvVar";

const mockMinioUrl = "https://dl.min.io/server/minio/release/linux-amd64/minio";

vi.mock("https", () => ({
  get: vi.fn(
    (
      url: string | URL | https.RequestOptions,
      options?: https.RequestOptions | ((res: IncomingMessage) => void),
      callback?: (res: IncomingMessage) => void,
    ) => {
      const mockResponse = { pipe: vi.fn() } as unknown as IncomingMessage;
      if (typeof options === "function") {
        options(mockResponse);
      } else if (callback) {
        callback(mockResponse);
      }
      return { on: vi.fn().mockReturnThis() };
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
vi.mock("../../../../src/setup/setPathEnvVar", () => ({
  setPathEnvVar: vi.fn(),
}));
vi.mock("../../../../src/setup/getMinioBinaryUrl", () => ({
  getMinioBinaryUrl: vi.fn(),
}));

describe("installMinio - Skip Create Directory", () => {
  const mockHomedir = "/mock/home";

  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue(mockHomedir);
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(getMinioBinaryUrl).mockReturnValue(mockMinioUrl);
  });

  it("should not create installation directory if it already exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const mkdirSyncMock = vi.mocked(fs.mkdirSync);
    vi.mocked(fs.chmodSync).mockImplementation(() => {});

    await installMinio();

    expect(mkdirSyncMock).not.toHaveBeenCalled();
    expect(https.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
    );
    expect(fs.createWriteStream).toHaveBeenCalledWith(expect.any(String));
    expect(mockWriteStream.on).toHaveBeenCalledWith(
      "finish",
      expect.any(Function),
    );
    expect(mockWriteStream.close).toHaveBeenCalled();
    expect(fs.chmodSync).toHaveBeenCalledWith(expect.any(String), 0o755);
    expect(setPathEnvVar).toHaveBeenCalledWith(expect.any(String));
  });
});
