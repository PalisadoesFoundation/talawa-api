import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { setPathEnvVar } from "./setPathEnvVar";

const platform = os.platform();

/**
 * Checks if MinIO is installed either via the command line or by checking the existence of the MinIO binary.
 * If installed, it sets the PATH environment variable.
 *
 * @returns A boolean indicating whether MinIO is installed.
 */
export const isMinioInstalled = (): boolean => {
  const installDir = path.join(os.homedir(), ".minio");
  const minioPath = path.join(
    installDir,
    `minio${platform === "win32" ? ".exe" : ""}`,
  );

  try {
    execSync("minio --version", { stdio: "ignore" });
    setPathEnvVar(installDir);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    if (fs.existsSync(minioPath)) {
      setPathEnvVar(installDir);
      return true;
    }
  }

  return false;
};
