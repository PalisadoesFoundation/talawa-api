/**
 * OS Detection Utilities
 */

import { execSync } from "node:child_process";
import os from "node:os";

import type { LinuxDistro, OperatingSystem, PackageManager } from "../types";

/**
 * Detect the current operating system
 */
export function detectOS(): OperatingSystem {
	const platform = process.platform;

	switch (platform) {
		case "win32":
			return "windows";
		case "darwin":
			return "macos";
		case "linux":
			return "linux";
		default:
			// Fallback to linux for other Unix-like systems
			return "linux";
	}
}

/**
 * Detect Linux distribution
 */
export function detectLinuxDistro(): LinuxDistro {
	if (detectOS() !== "linux") {
		return "unknown";
	}

	try {
		// Try reading /etc/os-release first (most reliable)
		const osRelease = execSync("cat /etc/os-release 2>/dev/null", {
			encoding: "utf-8",
		});

		const idMatch = osRelease.match(/^ID=(.*)$/m);
		if (idMatch?.[1]) {
			const id = idMatch[1].replace(/"/g, "").toLowerCase();

			if (id.includes("ubuntu")) return "ubuntu";
			if (id.includes("debian")) return "debian";
			if (id.includes("fedora")) return "fedora";
			if (id.includes("centos") || id.includes("rhel")) return "centos";
			if (id.includes("arch")) return "arch";
		}

		const idLikeMatch = osRelease.match(/^ID_LIKE=(.*)$/m);
		if (idLikeMatch?.[1]) {
			const idLike = idLikeMatch[1].replace(/"/g, "").toLowerCase();

			if (idLike.includes("debian") || idLike.includes("ubuntu"))
				return "debian";
			if (idLike.includes("fedora") || idLike.includes("rhel")) return "fedora";
			if (idLike.includes("arch")) return "arch";
		}
	} catch {
		// /etc/os-release not available
	}

	// Try other detection methods
	try {
		execSync("which apt-get 2>/dev/null", { encoding: "utf-8" });
		return "debian";
	} catch {
		// Not Debian-based
	}

	try {
		execSync("which dnf 2>/dev/null", { encoding: "utf-8" });
		return "fedora";
	} catch {
		// Not Fedora-based
	}

	try {
		execSync("which pacman 2>/dev/null", { encoding: "utf-8" });
		return "arch";
	} catch {
		// Not Arch-based
	}

	return "unknown";
}

/**
 * Check if running in WSL (Windows Subsystem for Linux)
 */
export function isWSL(): boolean {
	if (detectOS() !== "linux") {
		return false;
	}

	try {
		// Check for WSL-specific files/env
		const procVersion = execSync("cat /proc/version 2>/dev/null", {
			encoding: "utf-8",
		});
		return (
			procVersion.toLowerCase().includes("microsoft") ||
			procVersion.toLowerCase().includes("wsl")
		);
	} catch {
		return false;
	}
}

/**
 * Get the appropriate package manager for the current system
 */
export function getPackageManager(): PackageManager {
	const currentOS = detectOS();

	switch (currentOS) {
		case "windows":
			// Check for chocolatey
			try {
				execSync("choco --version", { encoding: "utf-8", stdio: "pipe" });
				return "choco";
			} catch {
				return "unknown";
			}

		case "macos":
			// Check for homebrew
			try {
				execSync("brew --version", { encoding: "utf-8", stdio: "pipe" });
				return "brew";
			} catch {
				return "unknown";
			}

		case "linux": {
			const distro = detectLinuxDistro();
			// Verify the package manager exists, similar to Windows/macOS
			try {
				switch (distro) {
					case "ubuntu":
					case "debian":
						execSync("apt --version", { encoding: "utf-8", stdio: "pipe" });
						return "apt";
					case "fedora":
					case "centos":
						execSync("dnf --version", { encoding: "utf-8", stdio: "pipe" });
						return "dnf";
					case "arch":
						execSync("pacman --version", { encoding: "utf-8", stdio: "pipe" });
						return "pacman";
					default:
						return "unknown";
				}
			} catch {
				return "unknown";
			}
		}

		default:
			return "unknown";
	}
}

/**
 * Get the home directory path
 */
export function getHomeDir(): string {
	return os.homedir();
}

/**
 * Check if running as root/admin
 */
export function isRoot(): boolean {
	if (detectOS() === "windows") {
		try {
			execSync("net session", { encoding: "utf-8", stdio: "pipe" });
			return true;
		} catch {
			return false;
		}
	}

	return process.getuid?.() === 0;
}
