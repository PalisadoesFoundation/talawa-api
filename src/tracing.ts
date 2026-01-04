import {
	fastifyOtelInstrumentation,
	initTracing,
} from "./observability/tracing/bootstrap";

try {
	await initTracing();
} catch (error) {
	console.error(
		"Failed to initialize tracing, continuing without observability:",
		error,
	);
}

export { fastifyOtelInstrumentation };
