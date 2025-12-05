#!/usr/bin/env node

/**
 * Cross-platform test sharding script for Windows/macOS/Linux compatibility
 * Reads SHARD_INDEX and SHARD_COUNT from env (defaults: 1 and 1)
 */

import { spawn } from "node:child_process";

const shardIndex = process.env.SHARD_INDEX || "1";
const shardCount = process.env.SHARD_COUNT || "1";
const withCoverage = process.argv.includes("--coverage");

// Validate shard values
const idx = Number.parseInt(shardIndex, 10);
const count = Number.parseInt(shardCount, 10);
if (
	Number.isNaN(idx) ||
	Number.isNaN(count) ||
	idx < 1 ||
	count < 1 ||
	idx > count
) {
	console.error(
		`Invalid shard configuration: SHARD_INDEX=${shardIndex}, SHARD_COUNT=${shardCount}`,
	);
	process.exit(1);
}

const args = ["vitest", "run"];
if (withCoverage) args.push("--coverage");
args.push("--shard", `${shardIndex}/${shardCount}`);

// Ensure SHARD_INDEX is set for vitest.config.ts to detect sharded runs
const env = {
	...process.env,
	SHARD_INDEX: shardIndex,
	SHARD_COUNT: shardCount,
	NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
};

const child = spawn("npx", args, { stdio: "inherit", shell: true, env });

for (const signal of ["SIGTERM", "SIGINT"]) {
	process.on(signal, () => {
		child.kill(signal);
	});
}

child.on("error", (err) => {
	console.error("Failed to spawn test process:", err);
	process.exit(1);
});

child.on("exit", (code, signal) => {
	if (signal) {
		console.error(`Test process terminated by signal: ${signal}`);
		// Use a non-zero exit for abnormal termination
		process.exit(1);
	}

	// Preserve non-zero exit codes from Vitest
	process.exit(code ?? 1);
});
