import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { execSync, spawnSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const platform = os.platform();
const minioVersion = "2023-05-30T22-14-07Z";
const spinnerChars = ["|", "/", "-", "\\"];
let spinnerIndex = 0;
const spinnerInterval = 100;

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

/**
 * Installs MinIO by downloading the binary, saving it to a local directory, and setting appropriate permissions.
 *
 * @returns A promise that resolves with the path to the installed MinIO binary.
 * @throws Error If the download or installation fails.
 */
export const installMinio = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const installDir = path.join(os.homedir(), ".minio");
    if (!fs.existsSync(installDir)) {
      try {
        fs.mkdirSync(installDir, { recursive: true });
      } catch (err: unknown) {
        if (err instanceof Error)
          return reject(
            new Error(
              `Failed to create directory ${installDir}: ${err.message}`,
            ),
          );
      }
    }
    const minioPath = path.join(
      installDir,
      `minio_${minioVersion}${platform === "win32" ? ".exe" : ""}`,
    );

    console.log("[MINIO] Starting Minio installation...");
    const spinner = setInterval(() => {
      process.stdout.write(`\r${spinnerChars[spinnerIndex++]}`);
      spinnerIndex %= spinnerChars.length;
    }, spinnerInterval);

    // Check if Minio binary already exists
    if (fs.existsSync(minioPath)) {
      console.log(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        "[MINIO] Minio is already installed.",
      );
      try {
        setPathEnvVar(installDir);
      } catch (err: unknown) {
        if (err instanceof Error)
          return reject(
            new Error(
              `Failed to set PATH environment variable: ${err.message}`,
            ),
          );
      }
      return resolve(minioPath);
    }

    console.log(`[MINIO] Downloading Minio from: ${getMinioBinaryUrl()}`);

    const file = fs.createWriteStream(minioPath);
    https
      .get(getMinioBinaryUrl(), (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            clearInterval(spinner);
            try {
              fs.chmodSync(minioPath, 0o755);
              setPathEnvVar(installDir);
            } catch (err: unknown) {
              if (err instanceof Error)
                return reject(
                  new Error(
                    `Failed to set permissions or PATH environment variable: ${err.message}`,
                  ),
                );
            }
            console.log("[MINIO] Minio installed successfully!");
            resolve(minioPath);
          });
        });
      })
      .on("error", (err) => {
        clearInterval(spinner);
        fs.unlinkSync(minioPath);
        reject(new Error(`Failed to download Minio binary: ${err.message}`));
      });
  });
};

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
    }
  } catch (err: unknown) {
    if (err instanceof Error)
      throw new Error(
        `Failed to set PATH environment variable: ${err.message}`,
      );
  }
};

/**
 * Checks if MinIO is installed by attempting to execute `minio --version`. If not installed, it triggers the installation process.
 *
 * @returns A promise that resolves with the path to the MinIO binary if it was installed or resolves with no value if MinIO was already installed.
 */
export const checkMinio = (): Promise<string | void> => {
  try {
    execSync("minio --version", { stdio: "ignore" });
    console.log("[MINIO] Minio is already installed.");
    setPathEnvVar(path.join(os.homedir(), ".minio"));
    return Promise.resolve();
  } catch (err) {
    return installMinio();
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
      minioPath || (platform === "win32" ? "minio.exe" : "minio");
    const minio = spawnSync(
      minioCommand,
      ["server", "./data", "--console-address", ":9001"],
      {
        env: {
          ...process.env,
          MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
          MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
        },
        stdio: "ignore",
      },
    );

    if (minio.error) {
      console.error(
        "\x1b[1m\x1b[31m%s\x1b[0m",
        "[MINIO] Failed to start Minio:",
        minio.error,
      );
    }
  })
  .catch((err) => {
    console.error(
      "\x1b[1m\x1b[31m%s\x1b[0m",
      "[MINIO] Failed to install or start Minio:",
      err,
    );
  });
