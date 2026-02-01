import { promptInput, promptList } from "../promptHelpers.js";
import type { SetupAnswers } from "../types.js";
import {
    validatePositiveInteger,
    validateSamplingRatio,
} from "../validators.js";

export async function observabilitySetup(
    answers: SetupAnswers,
): Promise<SetupAnswers> {
    // OpenTelemetry Setup
    console.log("\n--- OpenTelemetry Configuration ---");
    answers.API_OTEL_ENABLED = await promptList(
        "API_OTEL_ENABLED",
        "Enable OpenTelemetry observability?",
        ["true", "false"],
        "false",
    );

    if (answers.API_OTEL_ENABLED === "true") {
        answers.API_OTEL_SAMPLING_RATIO = await promptInput(
            "API_OTEL_SAMPLING_RATIO",
            "OpenTelemetry sampling ratio (0-1):",
            "1.0",
            validateSamplingRatio,
        );
    }

    // Metrics Setup
    console.log("\n--- Performance Metrics Configuration ---");
    console.log("Configure performance monitoring for your API.");
    console.log();

    answers.API_METRICS_ENABLED = await promptList(
        "API_METRICS_ENABLED",
        "Enable performance metrics collection?",
        ["true", "false"],
        "true",
    );

    if (answers.API_METRICS_ENABLED === "true") {
        const apiKeyInput = await promptInput(
            "API_METRICS_API_KEY",
            "API key for /metrics/perf endpoint (leave empty for no auth):",
            "",
        );
        answers.API_METRICS_API_KEY = apiKeyInput.trim() || undefined;

        answers.API_METRICS_SLOW_REQUEST_MS = await promptInput(
            "API_METRICS_SLOW_REQUEST_MS",
            "Slow request threshold in milliseconds:",
            "500",
            validatePositiveInteger,
        );

        answers.API_METRICS_SLOW_OPERATION_MS = await promptInput(
            "API_METRICS_SLOW_OPERATION_MS",
            "Slow operation threshold in milliseconds:",
            "200",
            validatePositiveInteger,
        );

        answers.API_METRICS_AGGREGATION_ENABLED = await promptList(
            "API_METRICS_AGGREGATION_ENABLED",
            "Enable background metrics aggregation?",
            ["true", "false"],
            "true",
        );

        if (answers.API_METRICS_AGGREGATION_ENABLED === "true") {
            answers.API_METRICS_AGGREGATION_CRON_SCHEDULE = await promptInput(
                "API_METRICS_AGGREGATION_CRON_SCHEDULE",
                "Aggregation cron schedule (default: every 5 minutes):",
                "*/5 * * * *",
            );

            answers.API_METRICS_AGGREGATION_WINDOW_MINUTES = await promptInput(
                "API_METRICS_AGGREGATION_WINDOW_MINUTES",
                "Aggregation window in minutes:",
                "5",
                validatePositiveInteger,
            );

            answers.API_METRICS_CACHE_TTL_SECONDS = await promptInput(
                "API_METRICS_CACHE_TTL_SECONDS",
                "Cache TTL for aggregated metrics in seconds:",
                "300",
                validatePositiveInteger,
            );
        }

        answers.API_METRICS_SNAPSHOT_RETENTION_COUNT = await promptInput(
            "API_METRICS_SNAPSHOT_RETENTION_COUNT",
            "Maximum snapshots to retain in memory:",
            "1000",
            validatePositiveInteger,
        );
    }

    console.log("\nObservability configuration completed!");
    return answers;
}
