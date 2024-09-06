// pathUtils.ts
import * as os from "os";
import { execSync, spawnSync } from "child_process";

const platform = os.platform();

/**
 * Sets the PATH environment variable to include the directory where MinIO is installed.
 *
 * @param installDir - The directory where MinIO is installed.
 * @throws Error If updating the PATH environment variable fails.
 */
export const setPathEnvVar = (installDir: string): void => {
  try {
    if (platform === "win32") {
      const pathEnvVar = `${process.env.PATH};${installDir}`;
      spawnSync("setx", ["PATH", pathEnvVar], {
        shell: true,
        stdio: "inherit",
      });
    } else {
      process.env.PATH = `${process.env.PATH}:${installDir}`;
      const shellConfigFile = platform === "darwin" ? "~/.zshrc" : "~/.bashrc";
      execSync(`echo 'export PATH=$PATH:${installDir}' >> ${shellConfigFile}`);
    }
  } catch (err: unknown) {
    console.log(err);
    if (err instanceof Error)
      throw new Error(
        `Failed to set PATH environment variable: ${err.message}`,
      );
  }
};
