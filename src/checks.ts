import { LAST_RESORT_SUPERADMIN_EMAIL } from "./constants";
import { User } from "./models";
import { generateErrorMessage } from "zod-error";
import { getEnvIssues } from "./env";
import { logger } from "./libraries";

const logWarningForSuperAdminEnvVariable = async (): Promise<void> => {
  const superAdminExist = await User.exists({ userType: "SUPERADMIN" });
  const isVariablePresentInEnvFile = !!LAST_RESORT_SUPERADMIN_EMAIL;
  if (superAdminExist) {
    if (isVariablePresentInEnvFile) {
      logger.warn(
        "\x1b[1m\x1b[33m%s\x1b[0m",
        "The LAST_RESORT_SUPERADMIN_EMAIL variable configured in your .env file poses a security risk. We strongly recommend that you remove it if not required. Please refer to the documentation in the INSTALLATION.md file.You have created super admin, please remove the LAST_RESORT_SUPERADMIN_EMAIL variable from .env file if you don't require it"
      );
    }
  } else {
    if (!isVariablePresentInEnvFile) {
      logger.warn(
        "\x1b[1m\x1b[33m%s\x1b[0m",
        "To create your first Super Admin, the LAST_RESORT_SUPERADMIN_EMAIL parameter needs to be set in the .env file. Please refer to the documentation in the INSTALLATION.md file."
      );
    }
  }
};

export const logIssues = async (): Promise<void> => {
  // Log all the environment variable issues
  const issues = getEnvIssues();
  if (issues) {
    logger.error(
      "Invalid environment variables found in your .env file, check the errors below!"
    );
    console.error(
      generateErrorMessage(issues, {
        delimiter: { error: "\\n" },
      })
    );
  } else {
    logger.info("The environment variables are valid!");
  }

  // Log the SuperAdmin environment variable issue (if any)
  await logWarningForSuperAdminEnvVariable();
};
