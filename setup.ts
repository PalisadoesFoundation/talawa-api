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
function checkEnvFile(): void {
  const env = dotenv.parse(fs.readFileSync(".env"));
  const envSample = dotenv.parse(fs.readFileSync(".env.sample"));
  const misplaced = Object.keys(envSample).filter((key) => !(key in env));
  if (misplaced.length > 0) {
    console.log("Please copy the contents of .env.sample to .env file");
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
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
  }

  if (refreshTokenSecret === null) {
    refreshTokenSecret = cryptolib.randomBytes(32).toString("hex");
    config.REFRESH_TOKEN_SECRET = refreshTokenSecret;
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
  }
}

// Check connection to Redis with the specified URL.
async function checkRedisConnection(url: string): Promise<boolean> {
  let response = false;
  const client = redis.createClient(url);

  console.log("\nChecking Redis connection....");

  try {
    await client.connect();
    console.log("\nConnection to Redis successful! 🎉");
    response = true;
  } catch (error) {
    console.log(`\nConnection to Redis failed. Please try again.\n`);
  }
  client.quit();
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
    while (!isConnected) {
      const { host, port, password } = await askForRedisUrl();
      url = `redis://${password ? password + "@" : ""}${host}:${port}`;
      isConnected = await checkRedisConnection(url);
    }

    const config = dotenv.parse(fs.readFileSync(".env"));
    config.REDIS_URL = url;
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
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
        "Enter the email which you wish to assign as the Super Admin of last resort:",
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
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
  } catch (err) {
    console.log(err);
    abort();
  }
}

// Function to check if local MongoDB instance is running
async function checkLocalMongoDB(): Promise<boolean> {
  try {
    await mongodb.connect("mongodb://localhost:27017", {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    return true;
  } catch (err) {
    return false;
  }
}

// Check the connection to MongoDB with the specified URL.
async function checkConnection(url: string): Promise<boolean> {
  const client = new mongodb.MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 1000,
  });

  console.log("\nChecking MongoDB connection....");

  try {
    await client.connect();
    console.log("\nConnection to MongoDB successful! 🎉");
    return true;
  } catch (error) {
    console.log(`\nConnection to MongoDB failed. Please try again.\n`);
    return false;
  } finally {
    await client.close();
  }
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
    let isConnected = await checkLocalMongoDB(),
      url = isConnected ? "mongodb://localhost:27017" : "";
    if (isConnected) {
      console.log("MongoDB URL detected: " + url);
    }

    while (!isConnected) {
      url = await askForMongoDBUrl();
      isConnected = await checkConnection(url);
    }

    DB_URL = `${url}/talawa-api`;
    const config = dotenv.parse(fs.readFileSync(".env"));
    config.MONGO_DB_URL = DB_URL;
    // Modifying the environment variable to be able to access the url in importData function.
    process.env.MONGO_DB_URL = DB_URL;
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
  } catch (err) {
    console.error(err);
    abort();
  }
}

//Get recaptcha details
async function recaptcha(): Promise<void> {
  console.log(
    "\nPlease visit this URL to set up reCAPTCHA:\n\nhttps://www.google.com/recaptcha/admin/create"
  );
  console.log(
    '\nSelect reCAPTCHA v2 and the "I`m not a robot" checkbox option'
  );
  console.log(
    '\nAdd "localhost" in domains and accept the terms, then press submit'
  );

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
  const config = dotenv.parse(fs.readFileSync(".env"));
  config.RECAPTCHA_SECRET_KEY = recaptchaSecretKey;
  fs.writeFileSync(".env", "");
  for (const key in config) {
    fs.appendFileSync(".env", `${key}=${config[key]}\n`);
  }
}
async function recaptchaSiteKey(): Promise<void> {
  console.log(
    "\nPlease visit this URL to set up reCAPTCHA:\n\nhttps://www.google.com/recaptcha/admin/create"
  );
  console.log(
    '\nSelect reCAPTCHA v2 and the "I`m not a robot" checkbox option'
  );
  console.log(
    '\nAdd "localhost" in domains and accept the terms, then press submit'
  );

  const { recaptchaSiteKey } = await inquirer.prompt([
    {
      type: "input",
      name: "recaptchaSiteKey",
      message: "Enter your reCAPTCHA site key:",
      validate: async (input: string): Promise<boolean | string> => {
        if (validateRecaptcha(input)) {
          return true;
        }
        return "Invalid reCAPTCHA site key. Please try again.";
      },
    },
  ]);
  const config = dotenv.parse(fs.readFileSync(".env"));
  config.RECAPTCHA_SITE_KEY = recaptchaSiteKey;
  fs.writeFileSync(".env", "");
  for (const key in config) {
    fs.appendFileSync(".env", `${key}=${config[key]}\n`);
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
  fs.writeFileSync(".env", "");
  for (const key in config) {
    fs.appendFileSync(".env", `${key}=${config[key]}\n`);
  }
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
        console.log(
          "\nCongratulations! Talawa API has been successfully setup! 🥂🎉"
        );
      }
    );
  } else {
    console.log(
      "\nCongratulations! Talawa API has been successfully setup! 🥂🎉"
    );
  }
}

type VerifySmtpConnectionReturnType = {
  success: boolean;
  error: any;
};
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
  fs.writeFileSync(".env", "");
  for (const key in config) {
    fs.appendFileSync(".env", `${key}=${config[key]}\n`);
  }

  console.log("SMTP configuration saved successfully.");
}

async function main(): Promise<void> {
  console.log("Welcome to the Talawa API setup! 🚀");

  if (!fs.existsSync(".env")) {
    fs.copyFileSync(".env.sample", ".env");
  } else {
    checkEnvFile();
  }

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
    default: true,
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
    default: true,
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

    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
    console.log(`Your MongoDB URL is:\n${process.env.MONGO_DB_URL}`);
    console.log(`Your Redis host is:\n${process.env.REDIS_HOST}`);
    console.log(`Your Redis port is:\n${process.env.REDIS_PORT}`);
  }

  if (!isDockerInstallation) {
    // Redis configuration
    if (process.env.REDIS_URL) {
      console.log(
        `\nRedis URL already exists with the value:\n${process.env.REDIS_URL}`
      );
    }
    const { shouldSetRedis } = await inquirer.prompt({
      type: "confirm",
      name: "shouldSetRedis",
      message: "Would you like to set up a Redis URL?",
      default: true,
    });
    if (shouldSetRedis) {
      await redisConfiguration();
    }

    // MongoDB configuration
    if (process.env.MONGO_DB_URL) {
      console.log(
        `\nMongoDB URL already exists with the value:\n${process.env.MONGO_DB_URL}`
      );
    }
    const { shouldSetMongoDb } = await inquirer.prompt({
      type: "confirm",
      name: "shouldSetMongoDb",
      message: "Would you like to set up a MongoDB URL?",
      default: true,
    });

    if (shouldSetMongoDb) {
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
    default: true,
  });

  if (shouldSetRecaptcha) {
    await recaptcha();
  }

  const { shouldSetRecaptchaSiteKey } = await inquirer.prompt({
    type: "confirm",
    name: "shouldSetRecaptchaSiteKey",
    message: "Would you like to set up a reCAPTCHA site key?",
    default: true,
  });

  if (shouldSetRecaptchaSiteKey) {
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
      default: true,
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
    fs.writeFileSync(".env", "");
    for (const key in config) {
      fs.appendFileSync(".env", `${key}=${config[key]}\n`);
    }
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
