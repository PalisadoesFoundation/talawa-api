import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";
import { installMinio } from "../../../../src/setup/installMinio";
import { setPathEnvVar } from "../../../../src/setup/setPathEnvVar";
import type { ClientRequest, IncomingMessage } from "http";

const mockMinioUrl = "https://dl.min.io/server/minio/release/linux-amd64/minio";

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

describe("installMinio", () => {
  const mockHomedir = "/mock/home";
  const mockInstallDir = "/mock/home/.minio";
  const mockMinioPath = "/mock/home/.minio/minio";

  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue(mockHomedir);
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(getMinioBinaryUrl).mockReturnValue(mockMinioUrl);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create installation directory if it does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const mkdirSyncMock = vi.mocked(fs.mkdirSync);

    const mockWriteStream = {
      close: vi.fn().mockImplementation((callback: () => void) => callback()),
      on: vi.fn().mockImplementation((event: string, handler: () => void) => {
        if (event === "finish") {
          handler();
        }
        return mockWriteStream;
      }),
    };

    vi.mocked(fs.createWriteStream).mockReturnValue(
      mockWriteStream as unknown as fs.WriteStream,
    );
    vi.mocked(fs.chmodSync).mockImplementation(() => {});

    await installMinio();

    expect(mkdirSyncMock).toHaveBeenCalledWith(mockInstallDir, {
      recursive: true,
    });
    expect(vi.mocked(https.get)).toHaveBeenCalledWith(
      mockMinioUrl,
      expect.any(Function),
    );
    expect(fs.createWriteStream).toHaveBeenCalledWith(mockMinioPath);
    expect(mockWriteStream.on).toHaveBeenCalledWith(
      "finish",
      expect.any(Function),
    );
    expect(mockWriteStream.close).toHaveBeenCalled();
    expect(fs.chmodSync).toHaveBeenCalledWith(mockMinioPath, 0o755);
    expect(vi.mocked(setPathEnvVar)).toHaveBeenCalledWith(mockInstallDir);
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
    expect(mockWriteStream.on).toHaveBeenCalledWith(
      "finish",
      expect.any(Function),
    );
  });

  it("should set permissions and update PATH", async () => {
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

    expect(fs.chmodSync).toHaveBeenCalledWith(mockMinioPath, 0o755);
    expect(setPathEnvVar).toHaveBeenCalledWith(mockInstallDir);
  });

  it("should handle errors during directory creation", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error("Directory creation failed");
    });

    await expect(installMinio()).rejects.toThrow("Failed to create directory");
  });

  it("should handle errors during download", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.createWriteStream).mockReturnValue({
      close: vi.fn(),
      on: vi.fn(),
    } as unknown as fs.WriteStream);

    vi.mocked(https.get).mockImplementation((_url, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (typeof cb === "function") {
        cb({
          pipe: vi.fn(),
        } as unknown as IncomingMessage);
      }
      return {
        on: vi.fn().mockImplementation((event, handler) => {
          if (event === "error") {
            handler(new Error("Download failed"));
          }
          return this;
        }),
      } as never;
    });

    vi.mocked(fs.unlinkSync).mockImplementation(() => {});

    await expect(installMinio()).rejects.toThrow(
      "Failed to download Minio binary",
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith(mockMinioPath);
  });

  it("should handle errors during setting permissions or updating PATH", async () => {
    const mockWriteStream = {
      close: vi.fn().mockImplementation((callback) => callback()),
      on: vi.fn().mockImplementation((event, handler) => {
        if (event === "finish") {
          handler();
        }
        return mockWriteStream;
      }),
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
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

    vi.mocked(fs.chmodSync).mockImplementation(() => {
      throw new Error("Permission denied");
    });

    await expect(installMinio()).rejects.toThrow(
      "Failed to set permissions or PATH environment variable: Permission denied",
    );

    expect(fs.chmodSync).toHaveBeenCalledWith(mockMinioPath, 0o755);
    expect(setPathEnvVar).not.toHaveBeenCalled();
  });
});
