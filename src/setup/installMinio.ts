import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as dotenv from "dotenv";
import { setPathEnvVar } from "./setPathEnvVar";
import { getMinioBinaryUrl } from "./getMinioBinaryUrl";

dotenv.config();

const platform = os.platform();

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
        if (err instanceof Error) {
          return reject(
            new Error(
              `Failed to create directory ${installDir}: ${err.message}`,
            ),
          );
        }
      }
    }
    const minioPath = path.join(
      installDir,
      `minio${platform === "win32" ? ".exe" : ""}`,
    );

    const file = fs.createWriteStream(minioPath);

    https
      .get(getMinioBinaryUrl(), (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            try {
              fs.chmodSync(minioPath, 0o755);
              setPathEnvVar(installDir);
            } catch (err: unknown) {
              if (err instanceof Error) {
                return reject(
                  new Error(
                    `Failed to set permissions or PATH environment variable: ${err.message}`,
                  ),
                );
              }
            }

            resolve(minioPath);
          });
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(minioPath);
        reject(new Error(`Failed to download Minio binary: ${err.message}`));
      });
  });
};
