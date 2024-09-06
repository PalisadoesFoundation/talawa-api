import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";
import * as dotenv from "dotenv";
import { isMinioInstalled } from "./setup/isMinioInstalled";
import { installMinio } from "./setup/installMinio";

dotenv.config();

/**
 * Checks if MinIO is installed by attempting to execute `minio --version`.
 * If MinIO is not installed, it triggers the installation process.
 *
 * This function first checks if MinIO is already installed by calling `isMinioInstalled()`.
 * - If MinIO is found to be installed, it logs a message and resolves with no value.
 * - If MinIO is not found, it initiates the installation process using `installMinio()`.
 *   - If the installation succeeds, it logs a success message and resolves with the path to the installed MinIO binary.
 *   - If the installation fails, it logs an error message and rejects the promise with the error.
 *
 * @returns A promise that resolves with:
 *   - The path to the MinIO binary if it was installed.
 *   - No value if MinIO was already installed.
 * @throws Error If an error occurs during the check or installation process.
 */
export const checkMinio = async (): Promise<string | void> => {
  try {
    if (isMinioInstalled()) {
      console.log("[MINIO] Minio is already installed.");
      return;
    } else {
      console.log("[MINIO] Minio is not installed.");
      console.log("[MINIO] Installing Minio...");
      try {
        const minioPath = await installMinio();
        console.log("[MINIO] Minio installed successfully.\n");
        return minioPath;
      } catch (err) {
        console.error("[MINIO] Failed to install Minio:", err);
        throw err;
      }
    }
  } catch (err) {
    console.error("[MINIO] An error occurred:", err);
    throw err;
  }
};

// Start MinIO installation or verification process
checkMinio()
  .then((minioPath) => {
    console.log("[MINIO] Starting server...");
    console.info(
      "\x1b[1m\x1b[32m%s\x1b[0m",
      "[MINIO] Minio started successfully!",
    );
    const minioCommand =
      minioPath ||
      path.join(
        os.homedir(),
        ".minio",
        `minio${os.platform() === "win32" ? ".exe" : ""}`,
      );
    const dataDir = process.env.MINIO_DATA_DIR || "./data";
    spawnSync(minioCommand, ["server", dataDir, "--console-address", ":9001"], {
      env: {
        ...process.env,
        MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
        MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
      },
      stdio: "inherit",
    });
  })
  .catch((err) => {
    console.error(
      "\x1b[1m\x1b[31m%s\x1b[0m",
      "[MINIO] Failed to install or start Minio:",
      err,
    );
  });
