import { LAST_RESORT_SUPERADMIN_EMAIL } from "./constants";
import { AppUserProfile } from "./models";
import { generateErrorMessage } from "zod-error";
import { getEnvIssues } from "./env";
import { logger } from "./libraries";
import { connect } from "./db";

/**
 * Logs warnings regarding the LAST_RESORT_SUPERADMIN_EMAIL environment variable.
 * This function checks if a super admin exists and if the LAST_RESORT_SUPERADMIN_EMAIL variable is present in the .env file.
 * Depending on the conditions, appropriate warnings are logged.
 */
const logWarningForSuperAdminEnvVariable = async (): Promise<void> => {
  // Connect to the database
  await connect();
  try {
    // Check if there is an existing super admin profile
    const superAdminExist = await AppUserProfile.exists({ isSuperAdmin: true });
    // Check if the LAST_RESORT_SUPERADMIN_EMAIL variable is present in the .env file
    const isVariablePresentInEnvFile = !!LAST_RESORT_SUPERADMIN_EMAIL;

    if (superAdminExist && isVariablePresentInEnvFile) {
      // Log a warning if both conditions are met
      logger.warn(
        "\x1b[1m\x1b[33m%s\x1b[0m",
        "The LAST_RESORT_SUPERADMIN_EMAIL variable configured in your .env file poses a security risk. We strongly recommend that you remove it if not required. Please refer to the documentation in the INSTALLATION.md file.You have created super admin, please remove the LAST_RESORT_SUPERADMIN_EMAIL variable from .env file if you don't require it",
      );
    } else if (!superAdminExist && !isVariablePresentInEnvFile) {
      // Log a warning if neither condition is met
      logger.warn(
        "\x1b[1m\x1b[33m%s\x1b[0m",
        "To create your first Super Admin, the LAST_RESORT_SUPERADMIN_EMAIL parameter needs to be set in the .env file. Please refer to the documentation in the INSTALLATION.md file.",
      );
    }
  } catch (error) {
    // Log an error if there's an exception while checking for super admin existence
    logger.error("Error checking for super admin existence:", error);
  }
};

/**
 * Logs issues related to environment variables.
 * This function logs any issues found with environment variables in the .env file.
 * It also logs warnings regarding the LAST_RESORT_SUPERADMIN_EMAIL variable.
 */
export const logIssues = async (): Promise<void> => {
  try {
    // Log all environment variable issues
    const issues = getEnvIssues();
    if (issues) {
      // Log errors if there are issues with environment variables
      logger.error(
        "Invalid environment variables found in your .env file, check the errors below!",
      );
      console.error(
        generateErrorMessage(issues, {
          delimiter: { error: "\\n" },
        }),
      );
    } else {
      // Log info message if environment variables are valid
      logger.info("The environment variables are valid!");
    }

    // Log warnings regarding the LAST_RESORT_SUPERADMIN_EMAIL variable
    await logWarningForSuperAdminEnvVariable();
  } catch (error) {
    // Log an error if there's an exception while logging environment variable issues
    logger.error("Error logging environment variable issues:", error);
  }
};
