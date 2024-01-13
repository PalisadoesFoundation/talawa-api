const dotenv = require("dotenv");
const fs = require("fs");
const cryptolib = require("crypto");
const inquirer = require("inquirer");
const mongodb = require("mongodb");
const redis = require("redis");
const { exec } = require("child_process");
const nodemailer = require("nodemailer");

dotenv.config();

// Check if all the fields in .env.sample are present in .env
/**
 * The function `checkEnvFile` checks if any fields are missing in the .env file compared to the .env.sample file, and
 * if so, it copies the missing fields from .env.sample to .env.
 */
function checkEnvFile(): void {
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

// Update the value of an environment variable in .env file
/**
 * The function `updateEnvVariable` updates the values of environment variables in a .env file based on the provided
 * configuration object.
 * @param config - An object that contains key-value pairs where the keys are strings and the values
 * can be either strings or numbers. These key-value pairs represent the environment variables that
 * need to be updated.
 */
function updateEnvVariable(config: { [key: string]: string | number }): void {
  const existingContent: string = fs.readFileSync(".env", "utf8");

  let updatedContent: string = existingContent;
  for (const key in config) {
    const regex = new RegExp(`^${key}=.*`, "gm");
    updatedContent = updatedContent.replace(regex, `${key}=${config[key]}`);
  }

  fs.writeFileSync(".env", updatedContent, "utf8");
}

// Get the node environment
/**
 * The function `getNodeEnvironment` is an asynchronous function that prompts the user to select a Node
 * environment (either "development" or "production") and returns the selected environment as a string.
 * @returns a Promise that resolves to a string representing the selected Node environment.
 */
async function getNodeEnvironment(): Promise<string> {
  const { nodeEnv } = await inquirer.prompt([
    {
      type: "list",
      name: "nodeEnv",
      message: "Select Node environment:",
      choices: ["development", "production"],
      default: "development",
    },
  ]);

  return nodeEnv;
}

/**
 * The function `setNodeEnvironment` sets the Node environment by reading the value from a file, updating the process
 * environment variable, and updating a configuration file.
 */
async function setNodeEnvironment(): Promise<void> {
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

// Generate and update the access and refresh token secrets in .env
/**
 * The function `accessAndRefreshTokens` generates and updates access and refresh tokens if they are
 * null.
 * @param {string | null} accessTokenSecret - A string representing the access token secret. It is
 * initially set to `null` and will be generated if it is `null`.
 * @param {string | null} refreshTokenSecret - The `refreshTokenSecret` parameter is a string that
 * represents the secret key used to generate and verify refresh tokens. Refresh tokens are typically
 * used in authentication systems to obtain new access tokens without requiring the user to
 * re-authenticate.
 */
async function accessAndRefreshTokens(
  accessTokenSecret: string | null,
  refreshTokenSecret: string | null
): Promise<void> {
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

// Check connection to Redis with the specified URL.
/**
 * The function `checkRedisConnection` checks if a connection to Redis can be established using the
 * provided URL.
 * @param {string} url - The `url` parameter is a string that represents the URL of the Redis server.
 * It is used to establish a connection to the Redis server.
 * @returns a Promise that resolves to a boolean value.
 */
async function checkRedisConnection(url: string): Promise<boolean> {
  let response = false;
  const client = redis.createClient({ url });

  console.log("\nChecking Redis connection....");

  try {
    await client.connect();
    console.log("\nConnection to Redis successful! 🎉");
    response = true;
  } catch (error) {
    console.log(`\nConnection to Redis failed. Please try again.\n`);
  } finally {
    client.quit();
  }
  return response;
}

// Redis url prompt
/**
 * The function `askForRedisUrl` prompts the user to enter the Redis hostname, port, and password, and
 * returns an object with these values.
 * @returns The function `askForRedisUrl` returns a promise that resolves to an object with the
 * properties `host`, `port`, and `password`.
 */
async function askForRedisUrl(): Promise<{
  host: string;
  port: number;
  password: string;
}> {
  const { host, port, password } = await inquirer.prompt([
    {
      type: "input",
      name: "host",
      message: "Enter Redis hostname (default: localhost):",
      default: "localhost",
    },
    {
      type: "input",
      name: "port",
      message: "Enter Redis port (default: 6379):",
      default: 6379,
    },
    {
      type: "password",
      name: "password",
      message:
        "Enter Redis password (optional : Leave empty for local connections) :",
    },
  ]);

  return { host, port, password };
}

// get the redis url
/**
 * The `redisConfiguration` function updates the Redis configuration by prompting the user for the
 * Redis URL, checking the connection, and updating the environment variables and .env file
 * accordingly.
 */
async function redisConfiguration(): Promise<void> {
  const REDIS_URL = process.env.REDIS_URL;

  try {
    let isConnected = false,
      url = "";
    let host!: string;
    let port!: number;
    let password!: string;

    while (!isConnected) {
      const result = await askForRedisUrl();
      host = result.host;
      port = result.port;
      password = result.password;

      url = `redis://${password ? password + "@" : ""}${host}:${port}`;
      isConnected = await checkRedisConnection(url);
    }

    // Set the Redis parameters in process.env
    process.env.REDIS_URL = url;
    process.env.REDIS_HOST = host;
    process.env.REDIS_PORT = port.toString();
    process.env.REDIS_PASSWORD = password;

    // Update the .env file
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.REDIS_URL = url;
    config.REDIS_HOST = host;
    config.REDIS_PORT = port;
    config.REDIS_PASSWORD = password;
    updateEnvVariable(config);
  } catch (err) {
    console.error(err);
    abort();
  }
}

//LAST_RESORT_SUPERADMIN_EMAIL prompt
/**
 * The function `askForSuperAdminEmail` asks the user to enter an email address and returns it as a promise.
 * @returns The email entered by the user is being returned.
 */
async function askForSuperAdminEmail(): Promise<string> {
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message:
        "Please make sure to register with this email before logging in.\n Enter the email which you wish to assign as the Super Admin of last resort :",
      validate: (input: string) =>
        isValidEmail(input) || "Invalid email. Please try again.",
    },
  ]);

  return email;
}

// Get the super admin email
/**
 * The function `superAdmin` prompts the user for a super admin email, updates a configuration file
 * with the email, and handles any errors that occur.
 */
async function superAdmin(): Promise<void> {
  try {
    const email = await askForSuperAdminEmail();
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.LAST_RESORT_SUPERADMIN_EMAIL = email;
    updateEnvVariable(config);
  } catch (err) {
    console.log(err);
    abort();
  }
}

// Function to check if Existing MongoDB instance is running
/**
 * The function `checkExistingMongoDB` checks for an existing MongoDB connection by iterating through a
 * list of URLs and testing the connection using the `checkConnection` function.
 * @returns The function `checkExistingMongoDB` returns a promise that resolves to a string or null.
 */
async function checkExistingMongoDB(): Promise<string | null> {
  const existingMongoDbUrls = [
    process.env.MONGO_DB_URL,
    "mongodb://localhost:27017",
  ];

  for (const url of existingMongoDbUrls) {
    if (!url) {
      continue;
    }

    const isConnected = await checkConnection(url);
    if (isConnected) {
      return url;
    }
  }

  return null;
}

// Check the connection to MongoDB with the specified URL.
/**
 * The function `checkConnection` is an asynchronous function that checks the connection to a MongoDB
 * database using the provided URL and returns a boolean value indicating whether the connection was
 * successful or not.
 * @param {string} url - The `url` parameter is a string that represents the connection URL for the
 * MongoDB server. It typically includes the protocol (e.g., `mongodb://`), the host and port
 * information, and any authentication credentials if required.
 * @returns a Promise that resolves to a boolean value. The boolean value indicates whether the
 * connection to the MongoDB server was successful (true) or not (false).
 */
async function checkConnection(url: string): Promise<boolean> {
  console.log("\nChecking MongoDB connection....");

  try {
    const connection = await mongodb.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 1000,
    });
    console.log("\nConnection to MongoDB successful! 🎉");
    await connection.close();
    return true;
  } catch (error) {
    console.log(`\nConnection to MongoDB failed. Please try again.\n`);
    return false;
  }
}

//Mongodb url prompt
/**
 * The function `askForMongoDBUrl` prompts the user to enter a MongoDB URL and returns the entered URL
 * as a string.
 * @returns a Promise that resolves to a string.
 */
async function askForMongoDBUrl(): Promise<string> {
  const { url } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: "Enter your MongoDB URL:",
      default: process.env.MONGO_DB_URL,
    },
  ]);

  return url;
}

// Get the mongodb url
/**
 * The `mongoDB` function connects to a MongoDB database by asking for a URL, checking the connection,
 * and updating the environment variable with the URL.
 */
async function mongoDB(): Promise<void> {
  let DB_URL = process.env.MONGO_DB_URL;

  try {
    let url = await checkExistingMongoDB();

    let isConnected = url !== null;

    if (isConnected) {
      console.log("MongoDB URL detected: " + url);
    }

    while (!isConnected) {
      url = await askForMongoDBUrl();
      isConnected = await checkConnection(url);
    }

    DB_URL = `${url?.endsWith("/talawa-api") ? url : `${url}/talawa-api`}`;
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.MONGO_DB_URL = DB_URL;
    // Modifying the environment variable to be able to access the url in importData function.
    process.env.MONGO_DB_URL = DB_URL;
    updateEnvVariable(config);
  } catch (err) {
    console.error(err);
    abort();
  }
}

// Function to ask if the user wants to keep the entered values
/**
 * The function `askToKeepValues` prompts the user with a confirmation message and returns a boolean
 * indicating whether the user wants to keep the entered key.
 * @returns a boolean value, either true or false.
 */
async function askToKeepValues(): Promise<boolean> {
  const { keepValues } = await inquirer.prompt({
    type: "confirm",
    name: "keepValues",
    message: `Would you like to keep the entered key? `,
    default: true,
  });
  return keepValues;
}

//Get recaptcha details
/**
 * The function `recaptcha` prompts the user to enter a reCAPTCHA secret key, validates the input, and
 * allows the user to choose whether to keep the entered value or try again.
 */
async function recaptcha(): Promise<void> {
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

  if (shouldKeepDetails) {
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.RECAPTCHA_SECRET_KEY = recaptchaSecretKey;
    updateEnvVariable(config);
  } else {
    await recaptcha();
  }
}

/**
 * The function `recaptchaSiteKey` prompts the user to enter a reCAPTCHA site key, validates the input,
 * and updates the environment variable if the user chooses to keep the entered value.
 */
async function recaptchaSiteKey(): Promise<void> {
  if (process.env.RECAPTCHA_SITE_KEY) {
    console.log(
      `\nreCAPTCHA site key already exists with the value ${process.env.RECAPTCHA_SITE_KEY}`
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

  if (shouldKeepDetails) {
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.RECAPTCHA_SITE_KEY = recaptchaSiteKeyInp;
    updateEnvVariable(config);
  } else {
    await recaptchaSiteKey();
  }
}

/**
 * The function `isValidEmail` checks if a given email address is valid according to a specific pattern.
 * @param {string} email - The `email` parameter is a string that represents an email address.
 * @returns a boolean value. It returns true if the email passed as an argument matches the specified
 * pattern, and false otherwise.
 */
function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  const match = email.match(pattern);
  return match !== null && match[0] === email;
}

/**
 * The function validates whether a given string matches the pattern of a reCAPTCHA token.
 * @param {string} string - The `string` parameter represents the input string that needs to be
 * validated. In this case, it is expected to be a string containing a Recaptcha response token.
 * @returns a boolean value.
 */
function validateRecaptcha(string: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]{40}$/;
  return pattern.test(string);
}

/**
 * The `abort` function logs a message and exits the process.
 */
function abort(): void {
  console.log("\nSetup process aborted. 🫠");
  process.exit(1);
}

//Get mail username and password
/**
 * The function `twoFactorAuth` prompts the user to set up Two-Factor Authentication Google Account and
 * then collects their email and generated password to update environment variables.
 */
async function twoFactorAuth(): Promise<void> {
  console.log("\nIMPORTANT");
  console.log(
    "\nEnsure that you have Two-Factor Authentication set up on your Google Account."
  );
  console.log("\nVisit Url: https://myaccount.google.com");
  console.log(
    "\nSelect Security and under Signing in to Google section select App Passwords."
  );
  console.log(
    "\nClick on Select app section and choose Other(Custom name), enter talawa as the custom name and press Generate button."
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
  const config = dotenv.parse(fs.readFileSync(".env"));

  config.MAIL_USERNAME = email;
  config.MAIL_PASSWORD = password;
  updateEnvVariable(config);
}

//Checks if the data exists and ask for deletion
/**
 * The function `shouldWipeExistingData` checks if there is existing data in a MongoDB database and prompts the user to delete
 * it before importing new data.
 * @param {string} url - The `url` parameter is a string that represents the connection URL for the
 * MongoDB database. It is used to establish a connection to the database using the `MongoClient` class
 * from the `mongodb` package.
 * @returns The function returns a Promise<boolean>.
 */
async function shouldWipeExistingData(url: string): Promise<boolean> {
  let shouldImport = false;
  const client = new mongodb.MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
async function importData(): Promise<void> {
  if (!process.env.MONGO_DB_URL) {
    console.log("Couldn't find mongodb url");
    return;
  }
  const shouldImport = await shouldWipeExistingData(process.env.MONGO_DB_URL);

  if (shouldImport) {
    console.log("Importing sample data...");
    await exec(
      "npm run import:sample-data",
      (error: { message: string }, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          abort();
        }
        if (stderr) {
          console.error(`Error: ${stderr}`);
          abort();
        }
        console.log(`Output: ${stdout}`);
      }
    );
  }
}

type VerifySmtpConnectionReturnType = {
  success: boolean;
  error: any;
};

/**
 * The function `verifySmtpConnection` verifies the SMTP connection using the provided configuration
 * and returns a success status and error message if applicable.
 * @param config - The `config` parameter is an object that contains the configuration settings for the
 * SMTP connection. It should have the following properties:
 * @returns The function `verifySmtpConnection` returns a Promise that resolves to an object of type
 * `VerifySmtpConnectionReturnType`. The `VerifySmtpConnectionReturnType` object has two properties:
 * `success` and `error`. If the SMTP connection is verified successfully, the `success` property will
 * be `true` and the `error` property will be `null`. If the SMTP connection verification fails
 */
async function verifySmtpConnection(
  config: Record<string, string>
): Promise<VerifySmtpConnectionReturnType> {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_SSL_TLS === "true",
    auth: {
      user: config.SMTP_USERNAME,
      pass: config.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("SMTP connection verification failed:");
    return { success: false, error };
  } finally {
    transporter.close();
  }
}

/**
 * The function `configureSmtp` prompts the user to configure SMTP settings for sending emails through
 * Talawa and saves the configuration in a .env file.
 * @returns a Promise that resolves to void.
 */
async function configureSmtp(): Promise<void> {
  console.log(
    "SMTP Configuration is necessary for sending Emails through Talawa"
  );
  const { shouldConfigureSmtp } = await inquirer.prompt({
    type: "confirm",
    name: "shouldConfigureSmtp",
    message: "Would you like to configure SMTP for Talawa to send emails?",
    default: true,
  });

  if (!shouldConfigureSmtp) {
    console.log("SMTP configuration skipped.");
    return;
  }

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
      "Invalid SMTP configuration. Please provide all required parameters."
    );
    return;
  }

  const { success, error } = await verifySmtpConnection(smtpConfig);

  if (!success) {
    console.error(
      "SMTP configuration verification failed. Please check your SMTP settings."
    );
    console.log(error.message);
    return;
  }

  const config = dotenv.parse(fs.readFileSync(".env"));
  config.IS_SMTP = "true";
  Object.assign(config, smtpConfig);
  updateEnvVariable(config);

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

  if (process.env.NODE_ENV) {
    console.log(`\nNode environment is already set to ${process.env.NODE_ENV}`);
  }
  await setNodeEnvironment();

  let accessToken: string | null = "",
    refreshToken: string | null = "";
  if (process.env.ACCESS_TOKEN_SECRET) {
    console.log(
      `\nAccess token secret already exists with the value:\n${process.env.ACCESS_TOKEN_SECRET}`
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
      `\nRefresh token secret already exists with the value:\n${process.env.REFRESH_TOKEN_SECRET}`
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
      console.log(`\nRedis URL already exists`);

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
        `\nMongoDB URL already exists with the value:\n${process.env.MONGO_DB_URL}`
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
      `\nreCAPTCHA secret key already exists with the value ${process.env.RECAPTCHA_SECRET_KEY}`
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

  if (process.env.MAIL_USERNAME) {
    console.log(
      `\nMail username already exists with the value ${process.env.MAIL_USERNAME}`
    );
  }
  await configureSmtp();
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
  }

  if (process.env.LAST_RESORT_SUPERADMIN_EMAIL) {
    console.log(
      `\nSuper Admin of last resort already exists with the value ${process.env.LAST_RESORT_SUPERADMIN_EMAIL}`
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
        "No super admin email configured, setting it to mail username's value."
      );
    }
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.LAST_RESORT_SUPERADMIN_EMAIL = config.MAIL_USERNAME;
    updateEnvVariable(config);
  }

  if (!isDockerInstallation) {
    const { shouldRunDataImport } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldRunDataImport",
        message: "Do you want to import sample data?",
        default: true,
      },
    ]);

    if (shouldRunDataImport) {
      await importData();
    }
  }

  console.log(
    "\nCongratulations! Talawa API has been successfully setup! 🥂🎉"
  );
}

main();
