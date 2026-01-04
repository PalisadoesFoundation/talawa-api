/**
 * One-Click Installation - Main Entry Point
 *
 * Usage:
 *   npx ts-node src/install/index.ts --docker    # Docker-based installation
 *   npx ts-node src/install/index.ts --local     # Local installation
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import type { InstallConfig, InstallResult } from "./types";
import * as logger from "./utils/logger";
import { detectOS, getPackageManager, isWSL } from "./utils/osDetection";
import {
	checkNodeVersion,
	checkPnpmVersion,
	checkPrerequisites,
} from "./utils/packageCheck";

/**
 * Parse command-line arguments
 */
/* v8 ignore start - CLI argument parsing tested via integration */
function parseArgs(): InstallConfig {
	const args = process.argv.slice(2);

	const config: InstallConfig = {
		os: detectOS(),
		mode: "docker", // Default to docker
		skipPrereqs: false,
		verbose: false,
	};

	for (const arg of args) {
		switch (arg) {
			case "--docker":
				config.mode = "docker";
				break;
			case "--local":
				config.mode = "local";
				break;
			case "--skip-prereqs":
				config.skipPrereqs = true;
				break;
			case "--verbose":
			case "-v":
				config.verbose = true;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
				break;
			default:
				if (arg.startsWith("-")) {
					logger.warn(`Unknown option: ${arg}`);
				}
		}
	}

	return config;
}
/* v8 ignore stop */

/**
 * Print help message
 */
/* v8 ignore start - CLI help output */
function printHelp(): void {
	console.log(`
Talawa API - One-Click Installation

Usage:
  npx ts-node src/install/index.ts [options]

Options:
  --docker        Install with Docker (default)
  --local         Install for local development
  --skip-prereqs  Skip prerequisite installation
  --verbose, -v   Enable verbose logging
  --help, -h      Show this help message

Examples:
  npx ts-node src/install/index.ts --docker
  npx ts-node src/install/index.ts --local --verbose
`);
}
/* v8 ignore stop */

/**
 * Display system information
 */
function displaySystemInfo(config: InstallConfig): void {
	logger.subHeader("System Information");
	logger.keyValue("Operating System", config.os);
	logger.keyValue("Package Manager", getPackageManager());
	logger.keyValue("WSL Detected", isWSL() ? "Yes" : "No");
	logger.keyValue("Installation Mode", config.mode);
	logger.blank();
}

/**
 * Check and display prerequisites status
 */
function displayPrerequisites(packageJsonPath: string): boolean {
	logger.subHeader("Checking Prerequisites");

	const checks = checkPrerequisites(packageJsonPath);
	let allPassed = true;

	for (const check of checks) {
		const versionInfo = check.version ? ` (v${check.version})` : "";
		const requiredInfo = check.requiredVersion
			? ` [required: ${check.requiredVersion}]`
			: "";
		const message = `${check.name}${versionInfo}${requiredInfo}`;

		if (check.installed) {
			logger.success(message);
		} else {
			logger.error(message);
		}

		if (check.required && !check.installed) {
			allPassed = false;
		}
	}

	logger.blank();
	return allPassed;
}

/**
 * Main installation function.
 *
 * This function checks prerequisites and provides setup guidance.
 * Actual package installation is handled by the shell scripts
 * (install.sh, install-linux.sh, install-macos.sh, install.ps1).
 *
 * @param config - Partial configuration options
 * @returns Installation result with success status and duration.
 *          Note: packagesInstalled will be empty as this module
 *          only validates prerequisites, not installs packages.
 */
export async function install(
	config?: Partial<InstallConfig>,
): Promise<InstallResult> {
	const startTime = Date.now();
	const fullConfig: InstallConfig = {
		os: detectOS(),
		mode: "docker",
		skipPrereqs: false,
		verbose: false,
		...config,
	};

	if (fullConfig.verbose) {
		logger.setVerbose(true);
	}

	logger.banner();
	displaySystemInfo(fullConfig);

	const packageJsonPath = path.resolve(process.cwd(), "package.json");

	// Verify package.json exists
	if (!fs.existsSync(packageJsonPath)) {
		logger.error(
			`package.json not found at ${packageJsonPath}. Please run this script from the repository root.`,
		);
		return {
			success: false,
			error: "package.json not found",
			packagesInstalled: [],
			duration: Date.now() - startTime,
		};
	}

	// Check prerequisites
	const prereqsPassed = displayPrerequisites(packageJsonPath);

	if (!prereqsPassed && !fullConfig.skipPrereqs) {
		logger.error(
			"Required prerequisites are missing. Please install them first.",
		);
		logger.info("Run the appropriate install script for your OS:");
		logger.info("  Linux/macOS: ./scripts/install/install.sh");
		logger.info("  Windows: .\\scripts\\install\\install.ps1");

		return {
			success: false,
			error: "Missing prerequisites",
			packagesInstalled: [],
			duration: Date.now() - startTime,
		};
	}

	// Check Node.js version
	if (!checkNodeVersion(packageJsonPath)) {
		logger.warn("Node.js version does not match requirement in package.json");
	}

	// Check pnpm version
	if (!checkPnpmVersion(packageJsonPath)) {
		logger.warn("pnpm version does not match requirement in package.json");
	}

	// Proceed with installation based on mode
	const modeLabel = fullConfig.mode === "docker" ? "Docker" : "Local";
	logger.subHeader(`Starting ${modeLabel} Installation`);
	logger.info(`${modeLabel} installation mode selected`);
	logger.info("Please run: pnpm run setup");

	logger.blank();
	logger.success("Installation check complete!");
	logger.info("Next steps:");
	logger.info("  1. Run 'pnpm run setup' to configure the application");
	logger.info("  2. Follow the prompts to set up your environment");

	return {
		success: true,
		packagesInstalled: [],
		duration: Date.now() - startTime,
	};
}

/**
 * CLI entry point
 */
/* v8 ignore start - CLI entry point */
async function main(): Promise<void> {
	try {
		const config = parseArgs();
		const result = await install(config);

		if (!result.success) {
			process.exit(1);
		}
	} catch (err) {
		logger.error(
			`Installation failed: ${err instanceof Error ? err.message : String(err)}`,
		);
		process.exit(1);
	}
}
/* v8 ignore stop */

/* v8 ignore start - direct execution detection */
// Run if executed directly (ESM-compatible)
const scriptPath = path.resolve(process.argv[1] || "");
const isDirectExecution = import.meta.url === pathToFileURL(scriptPath).href;

if (isDirectExecution) {
	main();
}
/* v8 ignore stop */
