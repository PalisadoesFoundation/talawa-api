/* v8 ignore start - type definitions only, no executable code */
/**
 * One-Click Installation - Type Definitions
 */

/** Supported operating systems */
export type OperatingSystem = "windows" | "linux" | "macos";

/** Linux distribution types */
export type LinuxDistro =
	| "ubuntu"
	| "debian"
	| "fedora"
	| "centos"
	| "arch"
	| "unknown";

/** Installation mode */
export type InstallMode = "docker" | "local";

/** Package manager types */
export type PackageManager =
	| "apt"
	| "brew"
	| "choco"
	| "dnf"
	| "pacman"
	| "unknown";

/** Installation configuration */
export interface InstallConfig {
	os: OperatingSystem;
	mode: InstallMode;
	skipPrereqs: boolean;
	verbose: boolean;
}

/** Package version information */
export interface PackageVersion {
	name: string;
	version: string | null;
	isInstalled: boolean;
	meetsRequirement: boolean;
}

/** Installation result */
export interface InstallResult {
	success: boolean;
	error?: string;
	packagesInstalled: string[];
	duration: number;
}

/** Prerequisite check result */
export interface PrereqCheck {
	name: string;
	required: boolean;
	installed: boolean;
	version: string | null;
	requiredVersion: string | null;
}
/* v8 ignore stop */
