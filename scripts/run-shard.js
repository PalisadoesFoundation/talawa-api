#!/usr/bin/env node

/**
 * Cross-platform test sharding script for Windows/macOS/Linux compatibility
 * Reads SHARD_INDEX and SHARD_COUNT from env (defaults: 1 and 1)
 */

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const isCI = !!process.env.CI;

// In CI, require SHARD_INDEX and SHARD_COUNT to be set; locally, use defaults
if (isCI && (!process.env.SHARD_INDEX || !process.env.SHARD_COUNT)) {
	console.error(
		"[CI Error] SHARD_INDEX and SHARD_COUNT must be set in CI environment",
	);
	process.exit(1);
}

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
	const prefix = isCI ? "[CI Error]" : "[Error]";
	console.error(
		`${prefix} Invalid shard configuration: SHARD_INDEX=${shardIndex}, SHARD_COUNT=${shardCount}`,
	);
	console.error(
		`${prefix} Requirements: both must be integers, 1 <= SHARD_INDEX <= SHARD_COUNT`,
	);
	process.exit(1);
}

const args = ["vitest", "run"];
if (withCoverage) args.push("--coverage");
args.push("--shard", `${shardIndex}/${shardCount}`);
// Add JSON reporter for machine-readable output (in addition to default reporter for human-readable output)
args.push("--reporter=verbose", "--reporter=json");
// Write JSON output to a deterministic file for reliable parsing
// Use os.tmpdir() for cross-platform compatibility (works on Windows, macOS, Linux)
const jsonOutputFile = join(tmpdir(), `shard-${shardIndex}-results.json`);
args.push("--outputFile", jsonOutputFile);

// Ensure SHARD_INDEX is set for vitest.config.ts to detect sharded runs
const env = {
	...process.env,
	SHARD_INDEX: shardIndex,
	SHARD_COUNT: shardCount,
};

const child = spawn("npx", args, { stdio: "inherit", shell: true, env });

child.on("error", (err) => {
	console.error("Failed to spawn test process:", err);
	process.exit(1);
});

child.on("exit", (code) => process.exit(code || 0));
