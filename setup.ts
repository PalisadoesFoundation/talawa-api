// eslint-disable-next-line
import * as cryptolib from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
/* eslint-disable */
import type { ExecException } from "child_process";
import { exec } from "child_process";
import { MongoClient } from "mongodb";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "./src/constants";
import {
  askForMongoDBUrl,
  checkConnection,
  checkExistingMongoDB,
} from "./src/setup/MongoDB";
import { askToKeepValues } from "./src/setup/askToKeepValues";
import { getNodeEnvironment } from "./src/setup/getNodeEnvironment";
import { isValidEmail } from "./src/setup/isValidEmail";
import { validateRecaptcha } from "./src/setup/reCaptcha";
import {
  askForRedisUrl,
  checkExistingRedis,
  checkRedisConnection,
} from "./src/setup/redisConfiguration";
import {
  setImageUploadSize,
  validateImageFileSize,
} from "./src/setup/setImageUploadSize";
import { askForSuperAdminEmail } from "./src/setup/superAdmin";
import { updateEnvVariable } from "./src/setup/updateEnvVariable";
import { verifySmtpConnection } from "./src/setup/verifySmtpConnection";
/* eslint-enable */

dotenv.config();

// Check if all the fields in .env.sample are present in .env
/**
 * The function `checkEnvFile` checks if any fields are missing in the .env file compared to the .env.sample file, and
 * if so, it copies the missing fields from .env.sampale to .env.
 */
export function checkEnvFile(): void {
  if (process.env.NODE_ENV === "test") {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const envSample = dotenv.parse(fs.readFileSync(".env.sample"));
    const misplaced = Object.keys(envSample).filter((key) => !(key in env));
    if (misplaced.length > 0) {
      // copy the missing fields from .env.sample to .env
      for (const key of misplaced) {
        fs.appendFileSync(".env_test", `${key}=${envSample[key]}\n`);
      }
    }
  } else {
    const env = dotenv.parse(fs.readFileSync(".env"));
    const envSample = dotenv.parse(fs.readFileSync(".env.sample"));
    const misplaced = Object.keys(envSample).filter((key) => !(key in env));
    if (misplaced.length > 0) {
      // copy the missing fields from .env.sample to .env
      for (const key of misplaced) {
        fs.appendFileSync(".env", `${key}=${envSample[key]}\n`);
      }
    }
  }
}

/**
 * The function `setNodeEnvironment` sets the Node environment by reading the value from a file, updating the process
 * environment variable, and updating a configuration file.
 */
export async function setNodeEnvironment(): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    try {
      const nodeEnv = await getNodeEnvironment();
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      config.NODE_ENV = nodeEnv;
      updateEnvVariable(config);
    } catch (err) {
      console.error(err);
      abort();
    }
  } else {
    try {
      const nodeEnv = await getNodeEnvironment();
      process.env.NODE_ENV = nodeEnv;

      const config = dotenv.parse(fs.readFileSync(".env"));
      config.NODE_ENV = nodeEnv;
      updateEnvVariable(config);
    } catch (err) {
      console.error(err);
      abort();
    }
  }
}

// Generate and update the access and refresh token secrets in .env
/**
 * The function `accessAndRefreshTokens` generates and updates access and refresh tokens if they are
 * null.
 * @param accessTokenSecret - A string representing the access token secret. It is
 * initially set to `null` and will be generated if it is `null`.
 * @param refreshTokenSecret - The `refreshTokenSecret` parameter is a string that
 * represents the secret key used to generate and verify refresh tokens. Refresh tokens are typically
 * used in authentication systems to obtain new access tokens without requiring the user to
 * re-authenticate.
 */
export async function accessAndRefreshTokens(
  accessTokenSecret: string | null,
  refreshTokenSecret: string | null,
): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    const config = dotenv.parse(fs.readFileSync(".env_test"));

    if (accessTokenSecret === null) {
      accessTokenSecret = cryptolib.randomBytes(32).toString("hex");
      config.ACCESS_TOKEN_SECRET = accessTokenSecret;
      updateEnvVariable(config);
    }

    if (refreshTokenSecret === null) {
      refreshTokenSecret = cryptolib.randomBytes(32).toString("hex");
      config.REFRESH_TOKEN_SECRET = refreshTokenSecret;
      updateEnvVariable(config);
    }
  } else {
    const config = dotenv.parse(fs.readFileSync(".env"));

    if (accessTokenSecret === null) {
      accessTokenSecret = cryptolib.randomBytes(32).toString("hex");
      config.ACCESS_TOKEN_SECRET = accessTokenSecret;
      updateEnvVariable(config);
    }

    if (refreshTokenSecret === null) {
      refreshTokenSecret = cryptolib.randomBytes(32).toString("hex");
      config.REFRESH_TOKEN_SECRET = refreshTokenSecret;
      updateEnvVariable(config);
    }
  }
}

function transactionLogPath(logPath: string | null): void {
  const config = dotenv.parse(fs.readFileSync(".env"));
  config.LOG = "true";
  if (!logPath) {
    // Check if the logs/transaction.log file exists, if not, create it
    const defaultLogPath = path.resolve(__dirname, "logs");
    const defaultLogFile = path.join(defaultLogPath, "transaction.log");
    if (!fs.existsSync(defaultLogPath)) {
      console.log("Creating logs/transaction.log file...");
      fs.mkdirSync(defaultLogPath);
    }

    config.LOG_PATH = defaultLogFile;
  } else {
    // Remove the logs files, if exists
    const logsDirPath = path.resolve(__dirname, "logs");
    if (fs.existsSync(logsDirPath)) {
      fs.readdirSync(logsDirPath).forEach((file: string) => {
        if (file !== "README.md") {
          const curPath = path.join(logsDirPath, file);
          fs.unlinkSync(curPath);
        }
      });
    }
    config.LOG_PATH = logPath;
  }
}

async function askForTransactionLogPath(): Promise<string> {
  let logPath: string | null;
  // Keep asking for path, until user gives a valid path
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "logPath",
        message: "Enter absolute path of log file:",
        default: null,
      },
    ]);
    logPath = response.logPath;
    if (logPath && fs.existsSync(logPath)) {
      try {
        fs.accessSync(logPath, fs.constants.R_OK | fs.constants.W_OK);
        break;
      } catch {
        console.error(
          "The file is not readable/writable. Please enter a valid file path.",
        );
      }
    } else {
      console.error(
        "Invalid path or file does not exist. Please enter a valid file path.",
      );
    }
  }
  return logPath;
}

//Checks if the data exists and ask for deletion
/**
 * The function `shouldWipeExistingData` checks if there is existing data in a MongoDB database and prompts the user to delete
 * it before importing new data.
 * @param url - The `url` parameter is a string that represents the connection URL for the
 * MongoDB database. It is used to establish a connection to the database using the `MongoClient` class
 * from the `mongodb` package.
 * @returns The function returns a Promise<boolean>.
 */
export async function shouldWipeExistingData(url: string): Promise<boolean> {
  let shouldImport = false;
  const client = new MongoClient(`${url}`);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();

    if (collections.length > 0) {
      const { confirmDelete } = await inquirer.prompt({
        type: "confirm",
        name: "confirmDelete",
        message:
          "We found data in the database. Do you want to delete the existing data before importing?",
      });

      if (confirmDelete) {
        for (const collection of collections) {
          await db.collection(collection.name).deleteMany({});
        }
        console.log("All existing data has been deleted.");
        shouldImport = true;
      } else {
        console.log("Deletion & import operation cancelled.");
      }
    } else {
      shouldImport = true;
    }
  } catch (error) {
    console.error("Could not connect to database to check for data");
  }
  client.close();
  return shouldImport;
}
//Import sample data
/**
 * The function `importData` imports sample data into a MongoDB database if the database URL is provided and if it
 * is determined that existing data should be wiped.
 * @returns The function returns a Promise that resolves to `void`.
 */
export async function importData(): Promise<void> {
  if (!process.env.MONGO_DB_URL) {
    console.log("Couldn't find mongodb url");
    return;
  }
  const shouldImport = await shouldWipeExistingData(process.env.MONGO_DB_URL);

  if (shouldImport) {
    console.log("Importing sample data...");
    if (process.env.NODE_ENV !== "test") {
      await exec(
        "npm run import:sample-data",
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            abort();
          }
          if (stderr) {
            console.error(`Error: ${stderr}`);
            abort();
          }
          console.log(`Output: ${stdout}`);
        },
      );
    }
  }
}

// get the redis url
/**
 * The `redisConfiguration` function updates the Redis configuration by prompting the user for the
 * Redis URL, checking the connection, and updating the environment variables and .env file
 * accordingly.
 */
export async function redisConfiguration(): Promise<void> {
  try {
    let host!: string;
    let port!: number;
    let password!: string;
    let url = await checkExistingRedis();
    let isConnected = url !== null;

    if (isConnected) {
      console.log("Redis URL detected: " + url);
      const { keepValues } = await inquirer.prompt({
        type: "confirm",
        name: "keepValues",
        message: `Do you want to connect to the detected Redis URL?`,
        default: true,
      });

      if (keepValues) {
        console.log("Keeping existing Redis URL: " + url);
        host = "localhost";
        port = 6379;
        password = "";
      } else {
        isConnected = false;
      }
    }
    url = "";

    while (!isConnected) {
      const result = await askForRedisUrl();
      host = result.host;
      port = result.port;
      password = result.password;
      url = `redis://${password ? password + "@" : ""}${host}:${port}`;
      isConnected = await checkRedisConnection(url);
    }

    if (isConnected) {
      console.log("\nConnection to Redis successful! 🎉");
    }

    // Set the Redis parameters in .env_test
    if (process.env.NODE_ENV === "test") {
      // Update the .env_test file
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      config.REDIS_HOST = host;
      config.REDIS_PORT = port.toString();
      config.REDIS_PASSWORD = password;
      updateEnvVariable(config);
    } else {
      // Set the Redis parameters in process.env
      process.env.REDIS_HOST = host;
      process.env.REDIS_PORT = port.toString();
      process.env.REDIS_PASSWORD = password;

      // Update the .env file
      const config = dotenv.parse(fs.readFileSync(".env"));
      config.REDIS_HOST = host;
      config.REDIS_PORT = port.toString();
      config.REDIS_PASSWORD = password;
      updateEnvVariable(config);
    }
  } catch (err) {
    console.error(err);
    abort();
  }
}

// Get the super admin email
/**
 * The function `superAdmin` prompts the user for a super admin email, updates a configuration file
 * with the email, and handles any errors that occur.
 */
export async function superAdmin(): Promise<void> {
  try {
    const email = await askForSuperAdminEmail();
    if (process.env.NODE_ENV === "test") {
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      config.LAST_RESORT_SUPERADMIN_EMAIL = email;
      updateEnvVariable(config);
    } else {
      const config = dotenv.parse(fs.readFileSync(".env"));
      config.LAST_RESORT_SUPERADMIN_EMAIL = email;
      updateEnvVariable(config);
    }
  } catch (err) {
    console.log(err);
    abort();
  }
}

// Get the mongodb url
/**
 * The `mongoDB` function connects to a MongoDB database by asking for a URL, checking the connection,
 * and updating the environment variable with the URL.
 */
export async function mongoDB(): Promise<void> {
  let DB_URL = process.env.MONGO_DB_URL;

  try {
    let url = await checkExistingMongoDB();
    let isConnected = url !== null;

    if (isConnected) {
      console.log("MongoDB URL detected: " + url);
      const { keepValues } = await inquirer.prompt({
        type: "confirm",
        name: "keepValues",
        message: `Do you want to connect to the detected MongoDB URL?`,
        default: true,
      });

      if (keepValues) {
        console.log("Keeping existing MongoDB URL: " + url);
      } else {
        isConnected = false;
      }
    }

    while (!isConnected) {
      url = await askForMongoDBUrl();
      isConnected = await checkConnection(url);
    }

    if (isConnected) {
      console.log("\nConnection to MongoDB successful! 🎉");
    }
    if (process.env.NODE_ENV === "test") {
      DB_URL = `${url?.endsWith("/talawa-api") ? url : `${url}/talawa-api`}`;
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      // Not updating actual environmental variable when in testing environment.
      config.MONGO_DB_URL = DB_URL;
      updateEnvVariable(config);
    } else {
      DB_URL = `${url?.endsWith("/talawa-api") ? url : `${url}/talawa-api`}`;
      const config = dotenv.parse(fs.readFileSync(".env"));
      config.MONGO_DB_URL = DB_URL;
      // Modifying the environment variable to be able to access the URL in importData function.
      process.env.MONGO_DB_URL = DB_URL;
      updateEnvVariable(config);
    }
  } catch (err) {
    console.error(err);
    abort();
  }
}

//Get recaptcha details
/**
 * The function `recaptcha` prompts the user to enter a reCAPTCHA secret key, validates the input, and
 * allows the user to choose whether to keep the entered value or try again.
 */
export async function recaptcha(): Promise<void> {
  const { recaptchaSecretKey } = await inquirer.prompt([
    {
      type: "input",
      name: "recaptchaSecretKey",
      message: "Enter your reCAPTCHA secret key:",
      validate: async (input: string): Promise<boolean | string> => {
        if (validateRecaptcha(input)) {
          return true;
        }
        return "Invalid reCAPTCHA secret key. Please try again.";
      },
    },
  ]);

  const shouldKeepDetails = await askToKeepValues();

  if (process.env.NODE_ENV === "test") {
    if (shouldKeepDetails) {
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      config.RECAPTCHA_SECRET_KEY = recaptchaSecretKey;
      updateEnvVariable(config);
    }
  } else {
    if (shouldKeepDetails) {
      const config = dotenv.parse(fs.readFileSync(".env"));
      config.RECAPTCHA_SECRET_KEY = recaptchaSecretKey;
      updateEnvVariable(config);
    } else {
      await recaptcha();
    }
  }
}

/**
 * The function `recaptchaSiteKey` prompts the user to enter a reCAPTCHA site key, validates the input,
 * and updates the environment variable if the user chooses to keep the entered value.
 */
export async function recaptchaSiteKey(): Promise<void> {
  if (process.env.RECAPTCHA_SITE_KEY) {
    console.log(
      `\nreCAPTCHA site key already exists with the value ${process.env.RECAPTCHA_SITE_KEY}`,
    );
  }

  const { recaptchaSiteKeyInp } = await inquirer.prompt([
    {
      type: "input",
      name: "recaptchaSiteKeyInp",
      message: "Enter your reCAPTCHA site key:",
      validate: async (input: string): Promise<boolean | string> => {
        if (validateRecaptcha(input)) {
          return true;
        }
        return "Invalid reCAPTCHA site key. Please try again.";
      },
    },
  ]);

  const shouldKeepDetails = await askToKeepValues();

  if (process.env.NODE_ENV === "test") {
    if (shouldKeepDetails) {
      const config = dotenv.parse(fs.readFileSync(".env_test"));
      config.RECAPTCHA_SITE_KEY = recaptchaSiteKeyInp;
      updateEnvVariable(config);
    }
  } else {
    if (shouldKeepDetails) {
      const config = dotenv.parse(fs.readFileSync(".env"));
      config.RECAPTCHA_SITE_KEY = recaptchaSiteKeyInp;
      updateEnvVariable(config);
    } else {
      await recaptchaSiteKey();
    }
  }
}

/**
 * The `abort` function logs a message and exits the process.
 */
export function abort(): void {
  console.log("\nSetup process aborted. 🫠");
  process.exit(1);
}

//Get mail username and password
/**
 * The function `twoFactorAuth` prompts the user to set up Two-Factor Authentication Google Account and
 * then collects their email and generated password to update environment variables.
 */
export async function twoFactorAuth(): Promise<void> {
  console.log("\nIMPORTANT");
  console.log(
    "\nEnsure that you have Two-Factor Authentication set up on your Google Account.",
  );
  console.log("\nVisit Url: https://myaccount.google.com");
  console.log(
    "\nSelect Security and under Signing in to Google section select App Passwords.",
  );
  console.log(
    "\nClick on Select app section and choose Other(Custom name), enter talawa as the custom name and press Generate button.",
  );

  const { email, password } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter your email:",
      validate: (input: string) =>
        isValidEmail(input) || "Invalid email. Please try again.",
    },
    {
      type: "password",
      name: "password",
      message: "Enter the generated password:",
    },
  ]);
  if (process.env.NODE_ENV === "test") {
    const config = dotenv.parse(fs.readFileSync(".env_test"));

    config.MAIL_USERNAME = email;
    config.MAIL_PASSWORD = password;
    updateEnvVariable(config);
  } else {
    const config = dotenv.parse(fs.readFileSync(".env"));

    config.MAIL_USERNAME = email;
    config.MAIL_PASSWORD = password;
    updateEnvVariable(config);
  }
}

/**
 * The function `configureSmtp` prompts the user to configure SMTP settings for sending emails through
 * Talawa and saves the configuration in a .env file.
 * @returns a Promise that resolves to void.
 */
export async function configureSmtp(): Promise<void> {
  const smtpConfig = await inquirer.prompt([
    {
      type: "input",
      name: "SMTP_HOST",
      message: "Enter SMTP host:",
    },
    {
      type: "input",
      name: "SMTP_PORT",
      message: "Enter SMTP port:",
    },
    {
      type: "input",
      name: "SMTP_USERNAME",
      message: "Enter SMTP username:",
    },
    {
      type: "password",
      name: "SMTP_PASSWORD",
      message: "Enter SMTP password:",
    },
    {
      type: "confirm",
      name: "SMTP_SSL_TLS",
      message: "Use SSL/TLS for SMTP?",
      default: false,
    },
  ]);

  const isValidSmtpConfig =
    smtpConfig.SMTP_HOST &&
    smtpConfig.SMTP_PORT &&
    smtpConfig.SMTP_USERNAME &&
    smtpConfig.SMTP_PASSWORD;

  if (!isValidSmtpConfig) {
    console.error(
      "Invalid SMTP configuration. Please provide all required parameters.",
    );
    return;
  }

  const { success, error } = await verifySmtpConnection(smtpConfig);

  if (!success) {
    console.error(
      "SMTP configuration verification failed. Please check your SMTP settings.",
    );
    if (error instanceof Error) {
      console.log(error.message);
    }
    return;
  }

  if (process.env.NODE_ENV === "test") {
    const config = dotenv.parse(fs.readFileSync(".env_test"));
    config.IS_SMTP = "true";
    Object.assign(config, smtpConfig);
    updateEnvVariable(config);
  } else {
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.IS_SMTP = "true";
    Object.assign(config, smtpConfig);
    updateEnvVariable(config);
  }
  console.log("SMTP configuration saved successfully.");
}

/**
 * The main function sets up the Talawa API by prompting the user to configure various environment
 * variables and import sample data if desired.
 */
async function main(): Promise<void> {
  console.log("Welcome to the Talawa API setup! 🚀");

  if (!fs.existsSync(".env")) {
    fs.copyFileSync(".env.sample", ".env");
  } else {
    checkEnvFile();
  }

  if (!fs.existsSync(".env_test")) {
    fs.copyFileSync(".env.sample", ".env_test");
  } else {
    checkEnvFile();
  }

  if (process.env.NODE_ENV) {
    console.log(`\nNode environment is already set to ${process.env.NODE_ENV}`);
  }
  await setNodeEnvironment();

  let accessToken: string | null = "",
    refreshToken: string | null = "";
  if (process.env.ACCESS_TOKEN_SECRET) {
    console.log(
      `\nAccess token secret already exists with the value:\n${process.env.ACCESS_TOKEN_SECRET}`,
    );
  }
  const { shouldGenerateAccessToken } = await inquirer.prompt({
    type: "confirm",
    name: "shouldGenerateAccessToken",
    message: "Would you like to generate a new access token secret?",
    default: process.env.ACCESS_TOKEN_SECRET ? false : true,
  });

  if (shouldGenerateAccessToken) {
    accessToken = null;
  }

  if (process.env.REFRESH_TOKEN_SECRET) {
    console.log(
      `\nRefresh token secret already exists with the value:\n${process.env.REFRESH_TOKEN_SECRET}`,
    );
  }
  const { shouldGenerateRefreshToken } = await inquirer.prompt({
    type: "confirm",
    name: "shouldGenerateRefreshToken",
    message: "Would you like to generate a new refresh token secret?",
    default: process.env.REFRESH_TOKEN_SECRET ? false : true,
  });

  if (shouldGenerateRefreshToken) {
    refreshToken = null;
  }

  accessAndRefreshTokens(accessToken, refreshToken);

  const { shouldLog } = await inquirer.prompt({
    type: "confirm",
    name: "shouldLog",
    message: "Would you like to enable logging for the database transactions?",
    default: true,
  });

  if (shouldLog) {
    if (process.env.LOG_PATH) {
      console.log(
        `\n Log path already exists with the value:\n${process.env.LOG_PATH}`,
      );
    }
    let logPath: string | null = null;
    const { shouldUseCustomLogPath } = await inquirer.prompt({
      type: "confirm",
      name: "shouldUseCustomLogPath",
      message: "Would you like to provide a custom path for storing logs?",
      default: false,
    });

    if (shouldUseCustomLogPath) {
      logPath = await askForTransactionLogPath();
    }
    transactionLogPath(logPath);
  }

  const { isDockerInstallation } = await inquirer.prompt({
    type: "confirm",
    name: "isDockerInstallation",
    message: "Are you setting up this project using Docker?",
    default: false,
  });

  if (isDockerInstallation) {
    const DB_URL = "mongodb://localhost:27017/talawa-api";
    const REDIS_HOST = "localhost";
    const REDIS_PORT = "6379"; // default Redis port
    const REDIS_PASSWORD = "";

    const config = dotenv.parse(fs.readFileSync(".env"));

    config.MONGO_DB_URL = DB_URL;
    config.REDIS_HOST = REDIS_HOST;
    config.REDIS_PORT = REDIS_PORT;
    config.REDIS_PASSWORD = REDIS_PASSWORD;

    process.env.MONGO_DB_URL = DB_URL;
    process.env.REDIS_HOST = REDIS_HOST;
    process.env.REDIS_PORT = REDIS_PORT;
    process.env.REDIS_PASSWORD = REDIS_PASSWORD;

    updateEnvVariable(config);
    console.log(`Your MongoDB URL is:\n${process.env.MONGO_DB_URL}`);
    console.log(`Your Redis host is:\n${process.env.REDIS_HOST}`);
    console.log(`Your Redis port is:\n${process.env.REDIS_PORT}`);
  }

  if (!isDockerInstallation) {
    // Redis configuration
    if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
      const redisPasswordStr = process.env.REDIS_PASSWORD
        ? "X".repeat(process.env.REDIS_PASSWORD.length)
        : "";

      const url = `redis://${
        process.env.REDIS_PASSWORD ? redisPasswordStr + "@" : ""
      }${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

      console.log(`\nRedis URL already exists with the value:\n${url}`);

      const { shouldSetupRedis } = await inquirer.prompt({
        type: "confirm",
        name: "shouldSetupRedis",
        message: "Would you like to change the existing Redis URL?",
        default:
          process.env.REDIS_HOST && process.env.REDIS_PORT ? false : true,
      });

      if (shouldSetupRedis) {
        await redisConfiguration();
      }
    } else {
      await redisConfiguration();
    }

    // MongoDB configuration
    if (process.env.MONGO_DB_URL) {
      console.log(
        `\nMongoDB URL already exists with the value:\n${process.env.MONGO_DB_URL}`,
      );

      const { shouldSetupMongo } = await inquirer.prompt({
        type: "confirm",
        name: "shouldSetupMongo",
        message: "Would you like to change the existing Mongo DB URL?",
        default: false,
      });

      if (shouldSetupMongo) {
        await mongoDB();
      }
    } else {
      await mongoDB();
    }
  }
  if (process.env.RECAPTCHA_SECRET_KEY) {
    console.log(
      `\nreCAPTCHA secret key already exists with the value ${process.env.RECAPTCHA_SECRET_KEY}`,
    );
  }
  const { shouldSetRecaptcha } = await inquirer.prompt({
    type: "confirm",
    name: "shouldSetRecaptcha",
    message: "Would you like to set up a reCAPTCHA secret key?",
    default: process.env.RECAPTCHA_SECRET_KEY ? false : true,
  });

  if (shouldSetRecaptcha) {
    await recaptcha();
    await recaptchaSiteKey();
  }

  console.log(
    "\n You can configure either SMTP or Mail for sending emails through Talawa.\n",
  );

  if (process.env.MAIL_USERNAME) {
    console.log(
      `Mail username already exists with the value ${process.env.MAIL_USERNAME}`,
    );
  }

  const { shouldSetMail } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSetMail",
      message: "Would you like to setup the mail username and password?",
      default: process.env.MAIL_USERNAME ? false : true,
    },
  ]);
  if (shouldSetMail) {
    await twoFactorAuth();
  } else {
    console.log("Mail configuration skipped.\n");

    const { shouldConfigureSmtp } = await inquirer.prompt({
      type: "confirm",
      name: "shouldConfigureSmtp",
      message: "Would you like to configure SMTP for Talawa to send emails?",
      default: true,
    });

    if (shouldConfigureSmtp) {
      await configureSmtp();
    } else {
      console.log("SMTP configuration skipped.\n");
    }
  }

  if (process.env.LAST_RESORT_SUPERADMIN_EMAIL) {
    console.log(
      `\nSuper Admin of last resort already exists with the value ${process.env.LAST_RESORT_SUPERADMIN_EMAIL}`,
    );
  }

  const { shouldSetSuperUserEmail } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSetSuperUserEmail",
      message: "Would you like to setup a Super Admin email of last resort?",
      default: process.env.LAST_RESORT_SUPERADMIN_EMAIL ? false : true,
    },
  ]);
  if (shouldSetSuperUserEmail) {
    await superAdmin();
  }
  // check if mail_username is set, if not, set it to mail_username's value
  else if (
    !shouldSetSuperUserEmail &&
    !process.env.LAST_RESORT_SUPERADMIN_EMAIL
    // process.env.MAIL_USERNAME
  ) {
    if (process.env.MAIL_USERNAME) {
      console.log(
        "No super admin email configured, setting it to mail username's value.",
      );
    }
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.LAST_RESORT_SUPERADMIN_EMAIL = config.MAIL_USERNAME;
    updateEnvVariable(config);
  }

  const { imageSizeLimit } = await inquirer.prompt([
    {
      type: "input",
      name: "imageSizeLimit",
      message: `Enter the maximum size limit of Images uploaded (in MB) max: ${
        MAXIMUM_IMAGE_SIZE_LIMIT_KB / 1000
      }`,
      default: 3,
      validate: (input: number) =>
        validateImageFileSize(input) ||
        `Enter a valid number between 0 and ${
          MAXIMUM_IMAGE_SIZE_LIMIT_KB / 1000
        }`,
    },
  ]);

  await setImageUploadSize(imageSizeLimit * 1000);

  if (!isDockerInstallation) {
    const { shouldRunDataImport } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldRunDataImport",
        message: "Do you want to import sample data?",
        default: false,
      },
    ]);

    if (shouldRunDataImport) {
      await importData();
    }
  }

  console.log(
    "\nCongratulations! Talawa API has been successfully setup! 🥂🎉",
  );
}

main();
