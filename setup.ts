import dotenv from "dotenv";
import fs from "fs";
import { updateEnvVariable } from "./src/setup/updateEnvVariable";
import { abort } from "process";
import inquirer from "inquirer";


let originalEnvContent: string | null = null;
const envFileName = ".env";

function backupEnvFile(): void {
  if (fs.existsSync(envFileName)) {
    originalEnvContent = fs.readFileSync(envFileName, "utf-8");
  } else {
    originalEnvContent = null;
  }
}

function restoreEnvFile(): void {
  try {
    if (originalEnvContent !== null) {
      fs.writeFileSync(envFileName, originalEnvContent, "utf-8");
      console.log("\nChanges undone. Restored the original environment file.");
    } else if (fs.existsSync(envFileName)) {
      fs.unlinkSync(envFileName);
      console.log("\nChanges undone. Removed the environment file.");
    }
  } catch (err) {
    console.error("Error restoring env file:", err);
  }
}

function checkEnvFile(): void {
  const envFileName = ".env";

  const envDevcontainer = dotenv.parse(fs.readFileSync("envFiles/.env.devcontainer"));

    dotenv.config({ path: envFileName });
    const content = Object.entries(envDevcontainer)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(envFileName, content, { encoding: "utf-8" });
}

export async function setNodeEnvironment(): Promise<void> {
      try {
        const { nodeEnv } = await inquirer.prompt([
          {
            type: "list",
            name: "nodeEnv",
            message: "Select Node environment:",
            choices: ["development", "production"],
            default: "development",
          },
        ]);
        process.env.NODE_ENV = nodeEnv;
      } catch (err) {
        console.error(err);
        abort();
      }
  }

// Get the administratorEmail email
/**
 * The function `administratorEmail` prompts the user for a administratorEmail email, updates a configuration file
 * with the email, and handles any errors that occur.
 */

  export async function administratorEmail(): Promise<void> {
    try {
      const { email } = await inquirer.prompt([
        {
          type: "input",
          name: "email",
          message:
            "Enter email :",
        },
      ]);
        process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = email;
    } catch (err) {
      console.log(err);
      abort();
    }
  }

export async function apiSetup(): Promise<void> {
  const questions = [
    {
      type: "input",
      name: "API_BASE_URL",
      message: "API base URL:",
      default: "http://127.0.0.1:4000"
    },
    {
      type: "input",
      name: "API_HOST",
      message: "API host:",
      default: "0.0.0.0"
    },
    {
      type: "input",
      name: "API_PORT",
      message: "API port:",
      default: "4000"
    },
    {
      type: "list",
      name: "API_IS_APPLY_DRIZZLE_MIGRATIONS",
      message: "Apply Drizzle migrations?",
      choices: ["true", "false"],
      default: "true"
    },
    {
      type: "list",
      name: "API_IS_GRAPHIQL",
      message: "Enable GraphQL?",
      choices: ["true", "false"],
      default: "true"
    },
    {
      type: "list",
      name: "API_IS_PINO_PRETTY",
      message: "Enable Pino Pretty logs?",
      choices: ["true", "false"],
      default: "true"
    },
    {
      type: "input",
      name: "API_JWT_EXPIRES_IN",
      message: "JWT expiration (ms):",
      default: "2592000000"
    },
    {
      type: "input",
      name: "API_JWT_SECRET",
      message: "JWT secret:",
      default: "b4896453be722d5ca94058a73f52b31c75980b485fa6d74d91f417a8059d8731"
    },
    {
      type: "input",
      name: "API_MINIO_ACCESS_KEY",
      message: "Minio access key:",
      default: "talawa"
    },
    {
      type: "input",
      name: "API_MINIO_END_POINT",
      message: "Minio endpoint:",
      default: "minio"
    },
    {
      type: "input",
      name: "API_MINIO_PORT",
      message: "Minio port:",
      default: "9000"
    },
    {
      type: "input",
      name: "API_MINIO_SECRET_KEY",
      message: "Minio secret key:",
      default: "password"
    },
    {
      type: "input",
      name: "API_MINIO_TEST_END_POINT",
      message: "Minio test endpoint:",
      default: "minio-test"
    },
    {
      type: "list",
      name: "API_MINIO_USE_SSL",
      message: "Use Minio SSL?",
      choices: ["true", "false"],
      default: "false"
    },
    {
      type: "input",
      name: "API_POSTGRES_DATABASE",
      message: "Postgres database:",
      default: "talawa"
    },
    {
      type: "input",
      name: "API_POSTGRES_HOST",
      message: "Postgres host:",
      default: "postgres"
    },
    {
      type: "input",
      name: "API_POSTGRES_PASSWORD",
      message: "Postgres password:",
      default: "password"
    },
    {
      type: "input",
      name: "API_POSTGRES_PORT",
      message: "Postgres port:",
      default: "5432"
    },
    {
      type: "list",
      name: "API_POSTGRES_SSL_MODE",
      message: "Use Postgres SSL?",
      choices: ["true", "false"],
      default: "false"
    },
    {
      type: "input",
      name: "API_POSTGRES_TEST_HOST",
      message: "Postgres test host:",
      default: "postgres-test"
    },
    {
      type: "input",
      name: "API_POSTGRES_USER",
      message: "Postgres user:",
      default: "talawa"
    }
  ];
  const answers = await inquirer.prompt(questions);

  updateEnvVariable(answers);

  Object.entries(answers).forEach(([key, value]) => {
    process.env[key] = value;
  });

  console.log("Environment variables updated.");
}

export async function cloudbeaverSetup(): Promise<void> {
  const questions = [
    {
      type: "input",
      name: "CLOUDBEAVER_ADMIN_NAME",
      message: "CloudBeaver admin name:",
      default: "talawa"
    },
    {
      type: "input",
      name: "CLOUDBEAVER_ADMIN_PASSWORD",
      message: "CloudBeaver admin password:",
      default: "password"
    },
    {
      type: "input",
      name: "CLOUDBEAVER_MAPPED_HOST_IP",
      message: "CloudBeaver mapped host IP:",
      default: "127.0.0.1"
    },
    {
      type: "input",
      name: "CLOUDBEAVER_MAPPED_PORT",
      message: "CloudBeaver mapped port:",
      default: "8978"
    },
    {
      type: "input",
      name: "CLOUDBEAVER_SERVER_NAME",
      message: "CloudBeaver server name:",
      default: "Talawa CloudBeaver Server"
    },
    {
      type: "input",
      name: "CLOUDBEAVER_SERVER_URL",
      message: "CloudBeaver server URL:",
      default: "http://127.0.0.1:8978"
    }
  ];

  const answers = await inquirer.prompt(questions);
  updateEnvVariable(answers);

  Object.entries(answers).forEach(([key, value]) => {
    process.env[key] = value;
  });
  console.log("CloudBeaver environment variables updated.");
}

export async function minioSetup(): Promise<void> {
  const questions = [
    {
      type: "input",
      name: "MINIO_BROWSER",
      message: "Minio browser (on/off):",
      default: "on"
    },
    {
      type: "input",
      name: "MINIO_API_MAPPED_HOST_IP",
      message: "Minio API mapped host IP:",
      default: "127.0.0.1"
    },
    {
      type: "input",
      name: "MINIO_API_MAPPED_PORT",
      message: "Minio API mapped port:",
      default: "9000"
    },
    {
      type: "input",
      name: "MINIO_CONSOLE_MAPPED_HOST_IP",
      message: "Minio console mapped host IP:",
      default: "127.0.0.1"
    },
    {
      type: "input",
      name: "MINIO_CONSOLE_MAPPED_PORT",
      message: "Minio console mapped port:",
      default: "9001"
    },
    {
      type: "input",
      name: "MINIO_ROOT_PASSWORD",
      message: "Minio root password:",
      default: "password"
    },
    {
      type: "input",
      name: "MINIO_ROOT_USER",
      message: "Minio root user:",
      default: "talawa"
    }
  ];

  const answers = await inquirer.prompt(questions);
  updateEnvVariable(answers);

  Object.entries(answers).forEach(([key, value]) => {
    process.env[key] = value;
  });
  console.log("Minio environment variables updated.");
}

export async function postgresSetup(): Promise<void> {
  const questions = [
    {
      type: "input",
      name: "POSTGRES_DB",
      message: "Postgres database:",
      default: "talawa"
    },
    {
      type: "input",
      name: "POSTGRES_MAPPED_HOST_IP",
      message: "Postgres mapped host IP:",
      default: "127.0.0.1"
    },
    {
      type: "input",
      name: "POSTGRES_MAPPED_PORT",
      message: "Postgres mapped port:",
      default: "5432"
    },
    {
      type: "input",
      name: "POSTGRES_PASSWORD",
      message: "Postgres password:",
      default: "password"
    },
    {
      type: "input",
      name: "POSTGRES_USER",
      message: "Postgres user:",
      default: "talawa"
    }
  ];

  const answers = await inquirer.prompt(questions);
  updateEnvVariable(answers);

  Object.entries(answers).forEach(([key, value]) => {
    process.env[key] = value;
  });
  console.log("Postgres environment variables updated.");
}

export async function main(): Promise<void> {
  dotenv.config({ path: envFileName });
  checkEnvFile();
  backupEnvFile();

  process.on("SIGINT", () => {
    console.log("\nProcess interrupted! Undoing changes...");
    restoreEnvFile();
    process.exit(1);
  });

  const {useDefaultApi}  = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaultApi",
      message: "Do you want to use the recommended default API settings? (Y)/N",
      default: true,
    },
  ]);
  if (!useDefaultApi) {
    await apiSetup();
  }

  const { useDefaultMinio } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaultMinio",
      message: "Do you want to use the recommended default Minio settings? (Y)/N",
      default: true,
    },
  ]);
  if (!useDefaultMinio) {
    await minioSetup();
  }

  const { useDefaultCloudbeaver } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaultCloudbeaver",
      message:
        "Do you want to use the recommended default CloudBeaver settings? (Y)/N",
      default: true,
    },
  ]);
  if (!useDefaultCloudbeaver) {
    await cloudbeaverSetup();
  }

  const { useDefaultPostgres } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaultPostgres",
      message:
        "Do you want to use the recommended default Postgres settings? (Y)/N",
      default: true,
    },
  ]);
  if (!useDefaultPostgres) {
    await postgresSetup();
  }
  await setNodeEnvironment();
  await administratorEmail();

  console.log("Configuration complete.");
}

main().catch((err) => {
  restoreEnvFile();
});
