/**
 * Tests for Package Check Utilities
 * @module test/install/packageCheck.test
 */

import * as childProcess from "node:child_process";
import fs from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
}));

vi.mock("node:fs", async () => {
	const mockReadFileSync = vi.fn();
	return {
		default: {
			readFileSync: mockReadFileSync,
		},
		readFileSync: mockReadFileSync,
	};
});

// Mock osDetection
vi.mock("~/src/install/utils/osDetection", () => ({
	detectOS: vi.fn(() => "linux"),
}));

import { detectOS } from "~/src/install/utils/osDetection";
import {
	checkNodeVersion,
	checkPackage,
	checkPnpmVersion,
	checkPrerequisites,
	compareVersions,
	getNodeVersionFromPackageJson,
	getPnpmVersionFromPackageJson,
	getVersion,
	isInstalled,
	meetsVersionRequirement,
} from "~/src/install/utils/packageCheck";

describe("packageCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("isInstalled", () => {
		it("returns true when command exists (Linux/macOS)", () => {
			vi.mocked(detectOS).mockReturnValue("linux");
			vi.mocked(childProcess.execSync).mockReturnValue("/usr/bin/git");
			expect(isInstalled("git")).toBe(true);
		});

		it("returns false when command does not exist", () => {
			vi.mocked(detectOS).mockReturnValue("linux");
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Command not found");
			});
			expect(isInstalled("nonexistent-command")).toBe(false);
		});

		it("uses 'where' command on Windows", () => {
			vi.mocked(detectOS).mockReturnValue("windows");
			vi.mocked(childProcess.execSync).mockReturnValue(
				"C:\\Program Files\\Git\\bin\\git.exe",
			);

			expect(isInstalled("git")).toBe(true);
			expect(childProcess.execSync).toHaveBeenCalledWith(
				"where git",
				expect.any(Object),
			);
		});

		it("uses 'which' command on Linux", () => {
			vi.mocked(detectOS).mockReturnValue("linux");
			vi.mocked(childProcess.execSync).mockReturnValue("/usr/bin/git");

			expect(isInstalled("git")).toBe(true);
			expect(childProcess.execSync).toHaveBeenCalledWith(
				"which git",
				expect.any(Object),
			);
		});
	});

	describe("getVersion", () => {
		it("returns version string when command exists", () => {
			// isInstalled also calls execSync, so we need multiple returns
			vi.mocked(childProcess.execSync).mockReturnValue("v22.0.0");

			expect(getVersion("node")).toBe("22.0.0");
		});

		it("returns null when command does not exist", () => {
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Command not found");
			});
			expect(getVersion("nonexistent")).toBe(null);
		});

		it("extracts version from various output formats", () => {
			// Mock always returns git version string
			vi.mocked(childProcess.execSync).mockReturnValue("git version 2.40.1");

			expect(getVersion("git")).toBe("2.40.1");
		});
	});

	describe("compareVersions", () => {
		it("returns 0 for equal versions", () => {
			expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
		});

		it("returns -1 when first version is lower", () => {
			expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
			expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
			expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
		});

		it("returns 1 when first version is higher", () => {
			expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
			expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
			expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
		});

		it("handles versions with different segment counts", () => {
			expect(compareVersions("1.0", "1.0.0")).toBe(0);
			expect(compareVersions("1", "1.0.0")).toBe(0);
			expect(compareVersions("2", "1.9.9")).toBe(1);
		});

		it("handles major version comparisons", () => {
			expect(compareVersions("22", "18")).toBe(1);
			expect(compareVersions("18", "22")).toBe(-1);
		});
	});

	describe("meetsVersionRequirement", () => {
		it("returns false when installed is null", () => {
			expect(meetsVersionRequirement(null, "1.0.0")).toBe(false);
		});

		it("returns true when installed meets requirement", () => {
			expect(meetsVersionRequirement("2.0.0", "1.0.0")).toBe(true);
			expect(meetsVersionRequirement("1.0.0", "1.0.0")).toBe(true);
		});

		it("returns false when installed is below requirement", () => {
			expect(meetsVersionRequirement("1.0.0", "2.0.0")).toBe(false);
		});

		it("handles version prefixes (>=, ^, ~)", () => {
			expect(meetsVersionRequirement("18.0.0", ">=18.0.0")).toBe(true);
			expect(meetsVersionRequirement("22.0.0", "^18.0.0")).toBe(true);
			expect(meetsVersionRequirement("17.0.0", ">=18.0.0")).toBe(false);
		});
	});

	describe("getNodeVersionFromPackageJson", () => {
		it("returns node version from package.json engines", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ engines: { node: ">=22.0.0" } }),
			);
			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBe(
				">=22.0.0",
			);
		});

		it("returns null when engines.node is not defined", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBe(null);
		});

		it("returns null when file read fails", () => {
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error("File not found");
			});
			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBe(null);
		});
	});

	describe("getPnpmVersionFromPackageJson", () => {
		it("returns pnpm version from packageManager field", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ packageManager: "pnpm@9.15.0+sha512.abc123" }),
			);
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBe(
				"9.15.0",
			);
		});

		it("returns null when packageManager is not pnpm", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ packageManager: "npm@10.0.0" }),
			);
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBe(null);
		});

		it("returns null when packageManager is not defined", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBe(null);
		});
	});

	describe("checkPackage", () => {
		it("returns package info with version when installed", () => {
			// Use consistent return since checkPackage calls isInstalled then getVersion
			vi.mocked(childProcess.execSync).mockReturnValue("v22.0.0");

			const result = checkPackage("node", ">=18.0.0");
			expect(result.isInstalled).toBe(true);
			expect(result.version).toBe("22.0.0");
			expect(result.meetsRequirement).toBe(true);
		});

		it("returns meetsRequirement false when version is below required", () => {
			vi.mocked(childProcess.execSync).mockReturnValue("v16.0.0");

			const result = checkPackage("node", ">=18.0.0");
			expect(result.isInstalled).toBe(true);
			expect(result.meetsRequirement).toBe(false);
		});

		it("returns not installed when command fails", () => {
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Not found");
			});

			const result = checkPackage("nonexistent");
			expect(result.isInstalled).toBe(false);
			expect(result.version).toBe(null);
		});
	});

	describe("checkPrerequisites", () => {
		it("returns array of prerequisite checks", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({
					engines: { node: ">=22.0.0" },
					packageManager: "pnpm@9.15.0",
				}),
			);

			// Mock all commands as installed
			vi.mocked(childProcess.execSync).mockReturnValue("version 1.0.0");

			const checks = checkPrerequisites("/path/to/package.json");
			expect(Array.isArray(checks)).toBe(true);
			expect(checks.length).toBeGreaterThan(0);

			const gitCheck = checks.find((c) => c.name === "git");
			expect(gitCheck).toBeDefined();
			expect(gitCheck?.required).toBe(true);
		});
	});

	describe("checkNodeVersion", () => {
		it("returns true when no requirement specified", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
			expect(checkNodeVersion("/path/to/package.json")).toBe(true);
		});

		it("returns true when installed version meets requirement", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ engines: { node: ">=18.0.0" } }),
			);
			vi.mocked(childProcess.execSync).mockReturnValue("v22.0.0");

			expect(checkNodeVersion("/path/to/package.json")).toBe(true);
		});
	});

	describe("checkPnpmVersion", () => {
		it("returns true when no requirement specified", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
			expect(checkPnpmVersion("/path/to/package.json")).toBe(true);
		});

		it("returns true when installed version meets requirement", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ packageManager: "pnpm@9.0.0" }),
			);
			vi.mocked(childProcess.execSync).mockReturnValue("9.15.0");

			expect(checkPnpmVersion("/path/to/package.json")).toBe(true);
		});
	});

	describe("getPnpmVersionFromPackageJson edge cases", () => {
		it("returns null when packageManager doesn't start with pnpm@", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ packageManager: "npm@8.0.0" }),
			);
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});

		it("returns null when packageManager is undefined", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});

		it("returns null when reading file throws an error", () => {
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error("File not found");
			});
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});

		it("handles pnpm version with +sha suffix", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ packageManager: "pnpm@9.0.0+sha256.abc123" }),
			);
			expect(getPnpmVersionFromPackageJson("/path/to/package.json")).toBe(
				"9.0.0",
			);
		});
	});

	describe("checkPackage edge cases", () => {
		it("returns meetsRequirement=false when package not installed but required version specified", () => {
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Command not found");
			});

			const result = checkPackage("missing-package", ">=1.0.0");

			expect(result.isInstalled).toBe(false);
			expect(result.version).toBeNull();
			expect(result.meetsRequirement).toBe(false);
		});

		it("returns meetsRequirement=true when no required version specified", () => {
			vi.mocked(childProcess.execSync).mockReturnValue("1.0.0\n");

			const result = checkPackage("some-package");

			expect(result.isInstalled).toBe(true);
			expect(result.meetsRequirement).toBe(true);
		});

		it("returns meetsRequirement=true when version meets requirement", () => {
			vi.mocked(childProcess.execSync).mockReturnValue("2.0.0\n");

			const result = checkPackage("some-package", ">=1.0.0");

			expect(result.isInstalled).toBe(true);
			expect(result.meetsRequirement).toBe(true);
		});

		it("returns meetsRequirement=false when version does not meet requirement", () => {
			vi.mocked(childProcess.execSync).mockReturnValue("0.9.0\n");

			const result = checkPackage("some-package", ">=1.0.0");

			expect(result.isInstalled).toBe(true);
			expect(result.meetsRequirement).toBe(false);
		});
	});

	describe("getVersion edge cases", () => {
		it("tries multiple version flags when first fails", () => {
			let callCount = 0;
			vi.mocked(childProcess.execSync).mockImplementation((_cmd) => {
				callCount++;
				// First call is for isInstalled (which)
				if (callCount === 1) return "/usr/bin/command";
				// Second call is --version which fails
				if (callCount === 2) throw new Error("Unknown flag");
				// Third call is -v which succeeds
				return "1.2.3";
			});

			const version = getVersion("some-command");
			expect(version).toBe("1.2.3");
		});

		it("returns null when no version flag works", () => {
			let callCount = 0;
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				callCount++;
				// First call is for isInstalled (which) - success
				if (callCount === 1) return "/usr/bin/command";
				// All other calls fail
				throw new Error("No version info");
			});

			const version = getVersion("some-command");
			expect(version).toBeNull();
		});
	});

	describe("getNodeVersionFromPackageJson edge cases", () => {
		it("returns null when file read throws error", () => {
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error("File not found");
			});

			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});

		it("returns null when engines.node is not defined", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));

			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});

		it("returns null when engines is defined but node is not", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ engines: { pnpm: ">=8.0.0" } }),
			);

			expect(getNodeVersionFromPackageJson("/path/to/package.json")).toBeNull();
		});
	});

	describe("checkNodeVersion edge cases", () => {
		it("returns false when node is not installed", () => {
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({ engines: { node: ">=18.0.0" } }),
			);
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("node not found");
			});

			expect(checkNodeVersion("/path/to/package.json")).toBe(false);
		});
	});
});
