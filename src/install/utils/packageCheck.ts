/**
 * Package Check Utilities
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import type { PackageVersion, PrereqCheck } from "../types";
import { detectOS } from "./osDetection";

/**
 * Check if a command/package is available in PATH
 */
export function isInstalled(command: string): boolean {
	const currentOS = detectOS();

	try {
		if (currentOS === "windows") {
			execSync(`where ${command}`, { encoding: "utf-8", stdio: "pipe" });
		} else {
			execSync(`which ${command}`, { encoding: "utf-8", stdio: "pipe" });
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the version of an installed package
 */
export function getVersion(command: string): string | null {
	if (!isInstalled(command)) {
		return null;
	}

	try {
		// Try common version flags
		const versionFlags = ["--version", "-v", "-V", "version"];

		for (const flag of versionFlags) {
			try {
				const output = execSync(`${command} ${flag}`, {
					encoding: "utf-8",
					stdio: "pipe",
				});

				// Extract version number using regex
				const versionMatch = output.match(/(\d+\.\d+\.\d+|\d+\.\d+|\d+)/);
				if (versionMatch?.[1]) {
					return versionMatch[1];
				}
			} catch {
				// Try next flag
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Check if docker compose is installed (handles both standalone and plugin)
 */
function isDockerComposeInstalled(): boolean {
	// Check standalone docker-compose
	if (isInstalled("docker-compose")) {
		return true;
	}
	// Check docker compose plugin (subcommand)
	try {
		execSync("docker compose version", { encoding: "utf-8", stdio: "pipe" });
		return true;
	} catch {
		/* v8 ignore next */
		return false;
	}
}

/* v8 ignore start - private function for docker compose version */
function getDockerComposeVersion(): string | null {
	// Try standalone first
	const standaloneVersion = getVersion("docker-compose");
	if (standaloneVersion) {
		return standaloneVersion;
	}
	// Try docker compose plugin
	try {
		const output = execSync("docker compose version --short", {
			encoding: "utf-8",
			stdio: "pipe",
		});
		const versionMatch = output.match(/(\d+\.\d+\.\d+|\d+\.\d+|\d+)/);
		if (versionMatch?.[1]) {
			return versionMatch[1];
		}
	} catch {
		// Plugin not available
	}
	return null;
}
/* v8 ignore stop */

/**
 * Compare semantic versions
 * @returns -1 if v1 is less than v2, 0 if equal, 1 if v1 is greater than v2
 */
export function compareVersions(v1: string, v2: string): number {
	const parts1 = v1.split(".").map((p) => Number.parseInt(p, 10) || 0);
	const parts2 = v2.split(".").map((p) => Number.parseInt(p, 10) || 0);

	const maxLength = Math.max(parts1.length, parts2.length);

	for (let i = 0; i < maxLength; i++) {
		const p1 = parts1[i] || 0;
		const p2 = parts2[i] || 0;

		if (p1 < p2) return -1;
		if (p1 > p2) return 1;
	}

	return 0;
}

/**
 * Check if installed version meets the required version
 */
export function meetsVersionRequirement(
	installed: string | null,
	required: string,
): boolean {
	if (!installed) return false;

	// Handle version strings like ">=18.0.0" or "^18.0.0"
	const requiredClean = required.replace(/^[>=^~]+/, "");

	return compareVersions(installed, requiredClean) >= 0;
}

/**
 * Get Node.js version requirement from package.json
 */
export function getNodeVersionFromPackageJson(
	packageJsonPath: string,
): string | null {
	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		return packageJson.engines?.node || null;
	} catch {
		return null;
	}
}

/**
 * Get pnpm version from package.json packageManager field
 */
export function getPnpmVersionFromPackageJson(
	packageJsonPath: string,
): string | null {
	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		const packageManager = packageJson.packageManager;

		if (packageManager?.startsWith("pnpm@")) {
			return packageManager.replace("pnpm@", "").split("+")[0];
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Check package status including version requirement
 */
export function checkPackage(
	name: string,
	requiredVersion?: string,
): PackageVersion {
	const installed = isInstalled(name);
	const version = installed ? getVersion(name) : null;

	let meetsRequirement = true;
	if (requiredVersion && version) {
		meetsRequirement = meetsVersionRequirement(version, requiredVersion);
	} else if (requiredVersion && !version) {
		meetsRequirement = false;
	}

	return {
		name,
		version,
		isInstalled: installed,
		meetsRequirement,
	};
}

/**
 * Check all prerequisites for installation
 */
export function checkPrerequisites(packageJsonPath: string): PrereqCheck[] {
	const nodeRequired = getNodeVersionFromPackageJson(packageJsonPath);
	const pnpmRequired = getPnpmVersionFromPackageJson(packageJsonPath);

	const checks: PrereqCheck[] = [
		{
			name: "git",
			required: true,
			installed: isInstalled("git"),
			version: getVersion("git"),
			requiredVersion: null,
		},
		{
			name: "node",
			required: true,
			installed: isInstalled("node"),
			version: getVersion("node"),
			requiredVersion: nodeRequired,
		},
		{
			name: "pnpm",
			required: true,
			installed: isInstalled("pnpm"),
			version: getVersion("pnpm"),
			requiredVersion: pnpmRequired,
		},
		{
			name: "docker",
			required: false, // Optional for local setup
			installed: isInstalled("docker"),
			version: getVersion("docker"),
			requiredVersion: null,
		},
		{
			name: "docker-compose",
			required: false,
			installed: isDockerComposeInstalled(),
			version: getDockerComposeVersion(),
			requiredVersion: null,
		},
	];

	return checks;
}

/**
 * Check Node.js version matches requirement
 */
export function checkNodeVersion(packageJsonPath: string): boolean {
	const required = getNodeVersionFromPackageJson(packageJsonPath);
	if (!required) return true; // No requirement specified

	const installed = getVersion("node");
	return meetsVersionRequirement(installed, required);
}

/**
 * Check pnpm version matches requirement
 */
export function checkPnpmVersion(packageJsonPath: string): boolean {
	const required = getPnpmVersionFromPackageJson(packageJsonPath);
	if (!required) return true; // No requirement specified

	const installed = getVersion("pnpm");
	return meetsVersionRequirement(installed, required);
}
