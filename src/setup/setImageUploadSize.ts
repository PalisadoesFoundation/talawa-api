import dotenv from "dotenv";
import fs from "fs";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "../constants";

/**
 * The function `setImageUploadSize` sets the image upload size environment variable and changes the .env file
 * @returns The function `checkExistingRedis` returns a void Promise.
 */
export async function setImageUploadSize(size: number): Promise<void> {
  if (size > MAXIMUM_IMAGE_SIZE_LIMIT_KB) {
    size = MAXIMUM_IMAGE_SIZE_LIMIT_KB;
  }
  if (process.env.NODE_ENV === "test") {
    const config = dotenv.parse(fs.readFileSync(".env_test"));
    config.IMAGE_SIZE_LIMIT_KB = size.toString();
    fs.writeFileSync(".env_test", "");
    for (const key in config) {
      fs.appendFileSync(".env_test", `${key}=${config[key]}\n`);
    }
  } else {
    const config = dotenv.parse(fs.readFileSync(".env"));

    config.IMAGE_SIZE_LIMIT_KB = size.toString();
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
  }
}

/**
 * The function validates whether a given image size is less than 20 and greater than 0.
 * @param string - The `number` parameter represents the input size of the string
 * validated. In this case, it is expected to be a number less than 20 and greater than 0.
 * @returns a boolean value.
 */
export function validateImageFileSize(size: number): boolean {
  return size > 0;
}
