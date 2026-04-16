import { promptInput, promptList } from "../promptHelpers";
import { handlePromptError, type SetupAnswers } from "./sharedSetup";
import { validateSamplingRatio } from "./validationSetup";

export async function observabilitySetup(
	answers: SetupAnswers,
): Promise<SetupAnswers> {
	try {
		console.log("\n--- OpenTelemetry Observability Configuration ---");
		console.log("Configure distributed tracing and metrics for your API.");
		console.log();

		answers.API_OTEL_ENABLED = await promptList(
			"API_OTEL_ENABLED",
			"Enable OpenTelemetry observability?",
			["true", "false"],
			"false",
		);

		if (answers.API_OTEL_ENABLED === "true") {
			answers.API_OTEL_SERVICE_NAME = await promptInput(
				"API_OTEL_SERVICE_NAME",
				"OpenTelemetry service name:",
				"talawa-api",
				(input: string) => {
					if (input.trim().length < 1) {
						return "Service name cannot be empty.";
					}
					return true;
				},
			);

			answers.API_OTEL_SAMPLING_RATIO = await promptInput(
				"API_OTEL_SAMPLING_RATIO",
				"OpenTelemetry sampling ratio (0-1):",
				"1",
				validateSamplingRatio,
			);

			answers.API_OTEL_EXPORTER_ENABLED = await promptList(
				"API_OTEL_EXPORTER_ENABLED",
				"Enable OpenTelemetry exporter?",
				["true", "false"],
				"true",
			);

			if (answers.API_OTEL_EXPORTER_ENABLED === "true") {
				answers.API_OTEL_EXPORTER_TYPE = await promptList(
					"API_OTEL_EXPORTER_TYPE",
					"Select exporter type:",
					["console", "otlp"],
					"console",
				);

				if (answers.API_OTEL_EXPORTER_TYPE === "otlp") {
					console.log("\n--- OTLP Exporter Configuration ---");
					console.log(
						"Configure endpoints for traces and metrics export to OTLP receivers.",
					);
					console.log(
						"Common examples: http://localhost:4318/v1/traces or http://otel-collector:4318/v1/traces",
					);
					console.log();

					answers.API_OTEL_TRACE_EXPORTER_ENDPOINT = await promptInput(
						"API_OTEL_TRACE_EXPORTER_ENDPOINT",
						"OTLP trace exporter endpoint URL:",
						"",
						(input: string) => {
							try {
								new URL(input.trim());
								return true;
							} catch {
								return "Please enter a valid URL (e.g., http://localhost:4318/v1/traces).";
							}
						},
					);

					answers.API_OTEL_METRIC_EXPORTER_ENDPOINT = await promptInput(
						"API_OTEL_METRIC_EXPORTER_ENDPOINT",
						"OTLP metric exporter endpoint URL:",
						"",
						(input: string) => {
							try {
								new URL(input.trim());
								return true;
							} catch {
								return "Please enter a valid URL (e.g., http://localhost:4318/v1/metrics).";
							}
						},
					);
				} else {
					answers.API_OTEL_TRACE_EXPORTER_ENDPOINT = "";
					answers.API_OTEL_METRIC_EXPORTER_ENDPOINT = "";
				}
			}

			console.log("\nOpenTelemetry observability configuration completed!");
		}
	} catch (err) {
		await handlePromptError(err);
	}
	return answers;
}
