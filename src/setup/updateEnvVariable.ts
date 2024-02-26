import fs from "fs";

// Update the value of an environment variable in .env file
/**
 * The function `updateEnvVariable` updates the values of environment variables in a .env file based on the provided
 * configuration object.
 * @param config - An object that contains key-value pairs where the keys are strings and the values
 * can be either strings or numbers. These key-value pairs represent the environment variables that
 * need to be updated.
 */
export function updateEnvVariable(config: {
  [key: string]: string | number;
}): void {
  if (process.env.NODE_ENV === "test") {
    const existingContent: string = fs.readFileSync(".env_test", "utf8");
    let updatedContent: string = existingContent;
    for (const key in config) {
      const regex = new RegExp(`^${key}=.*`, "gm");
      updatedContent = updatedContent.replace(regex, `${key}=${config[key]}`);
    }
    fs.writeFileSync(".env_test", updatedContent, "utf8");
  } else {
    const existingContent: string = fs.readFileSync(".env", "utf8");
    let updatedContent: string = existingContent;
    for (const key in config) {
      const regex = new RegExp(`^${key}=.*`, "gm");
      updatedContent = updatedContent.replace(regex, `${key}=${config[key]}`);
    }
    fs.writeFileSync(".env", updatedContent, "utf8");
  }
}
