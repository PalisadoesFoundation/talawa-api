import * as os from "os";

const platform = os.platform();

/**
 * Constructs the URL to download the MinIO binary for the current platform.
 *
 * @returns The URL of the MinIO binary for the current platform.
 * @throws Error If the platform is unsupported.
 */
export const getMinioBinaryUrl = (): string => {
  let platformPath: string;
  switch (platform) {
    case "win32":
      platformPath = "windows-amd64/minio.exe";
      break;
    case "darwin":
      platformPath = "darwin-amd64/minio";
      break;
    case "linux":
      platformPath = "linux-amd64/minio";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  return `https://dl.min.io/server/minio/release/${platformPath}`;
};
