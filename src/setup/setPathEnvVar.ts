// pathUtils.ts
import * as os from "os";
import { execSync, spawnSync } from "child_process";

const platform = os.platform();

/**
 * Sets the PATH environment variable to include the directory where MinIO is installed.
 *
 * This function modifies the PATH environment variable to include the specified installation directory.
 * It handles different platforms:
 * - On Windows, it uses `setx` to update the system PATH variable.
 * - On Unix-based systems (macOS and Linux), it appends the directory to the PATH in the current shell session
 *   and writes the update to the shell configuration file (`~/.bashrc` for Linux, `~/.zshrc` for macOS).
 *
 * **Assumption:**
 * This function assumes that the shell configuration file (`.bashrc` or `.zshrc`) already exists. In most typical
 * development environments, these files are present. If the file does not exist, users may need to create it manually
 * to ensure the PATH update is applied in future shell sessions.
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
