const dotenv = require("dotenv");
const fs = require("fs");
const cryptolib = require("crypto");
const inquirer = require("inquirer");
const mongodb = require("mongodb");
const redis = require("redis");
const { exec } = require("child_process");

dotenv.config();

// Check if all the fields in .env.sample are present in .env
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
    console.log("\nRedis configuration updated successfully!");
  } catch (err) {
    console.error(err);
    abort();
  }
}

//LAST_RESORT_SUPERADMIN_EMAIL prompt
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

// Check the connection to MongoDB with the specified URL.
async function checkConnection(url: string): Promise<boolean> {
  let response = false;
  const client = new mongodb.MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 1000,
  });

  console.log("\nChecking MongoDB connection....");

  try {
    await client.connect();
    console.log("\nConnection to MongoDB successful! 🎉");
    response = true;
  } catch (error) {
    console.log(`\nConnection to MongoDB failed. Please try again.\n`);
  }
  client.close();
  return response;
}

//Mongodb url prompt
async function askForMongoDBUrl(): Promise<string> {
  const { url } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: "Enter your MongoDB URL:",
    },
  ]);

  return url;
}

// Get the mongodb url
async function mongoDB(): Promise<void> {
  let DB_URL = process.env.MONGO_DB_URL;

  try {
    let isConnected = false,
      url = "";
    while (!isConnected) {
      url = await askForMongoDBUrl();
      isConnected = await checkConnection(url);
    }

    DB_URL = url;
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

function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  const match = email.match(pattern);
  return match !== null && match[0] === email;
}

function validateRecaptcha(string: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]{40}$/;
  return pattern.test(string);
}

function abort(): void {
  console.log("\nSetup process aborted. 🫠");
  process.exit(1);
}

//Get mail username and password
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
  if (!isDockerInstallation) {
    // Redis configuration
    if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
      const url = `redis://${
        process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + "@" : ""
      }${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
      console.log(`\nRedis URL already exists with the value:\n${url}`);
    }

    await redisConfiguration();

    // MongoDB configuration
    if (process.env.MONGO_DB_URL) {
      console.log(
        `\nMongoDB URL already exists with the value:\n${process.env.MONGO_DB_URL}`
      );
    }

    await mongoDB();
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
