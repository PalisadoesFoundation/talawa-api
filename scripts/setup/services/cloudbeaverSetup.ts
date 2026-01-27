import {
    validateCloudBeaverAdmin,
    validateCloudBeaverPassword,
    validateCloudBeaverURL,
    validatePort,
} from "../validators.js";
import { promptInput } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";

async function handlePromptError(err: unknown): Promise<never> {
    throw err;
}

export async function cloudbeaverSetup(
    answers: SetupAnswers,
): Promise<SetupAnswers> {
    try {
        answers.CLOUDBEAVER_ADMIN_NAME = await promptInput(
            "CLOUDBEAVER_ADMIN_NAME",
            "CloudBeaver admin name:",
            "talawa",
            validateCloudBeaverAdmin,
        );
        answers.CLOUDBEAVER_ADMIN_PASSWORD = await promptInput(
            "CLOUDBEAVER_ADMIN_PASSWORD",
            "CloudBeaver admin password:",
            process.env.CLOUDBEAVER_ADMIN_PASSWORD ?? "",
            validateCloudBeaverPassword,
        );
        answers.CLOUDBEAVER_MAPPED_HOST_IP = await promptInput(
            "CLOUDBEAVER_MAPPED_HOST_IP",
            "CloudBeaver mapped host IP:",
            "127.0.0.1",
        );
        answers.CLOUDBEAVER_MAPPED_PORT = await promptInput(
            "CLOUDBEAVER_MAPPED_PORT",
            "CloudBeaver mapped port:",
            "8978",
            validatePort,
        );
        answers.CLOUDBEAVER_SERVER_NAME = await promptInput(
            "CLOUDBEAVER_SERVER_NAME",
            "CloudBeaver server name:",
            "Talawa CloudBeaver Server",
        );
        answers.CLOUDBEAVER_SERVER_URL = await promptInput(
            "CLOUDBEAVER_SERVER_URL",
            "CloudBeaver server URL:",
            "http://127.0.0.1:8978",
            validateCloudBeaverURL,
        );
    } catch (err) {
        await handlePromptError(err);
    }
    return answers;
}
