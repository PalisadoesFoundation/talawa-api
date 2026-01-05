/**
 * Tests for OS Detection Utilities
 * @module test/install/osDetection.test
 */

import * as childProcess from "node:child_process";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We need to mock before importing the module
vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
}));

// Import after mocking
import {
	detectLinuxDistro,
	detectOS,
	getHomeDir,
	getPackageManager,
	isRoot,
	isWSL,
} from "~/src/install/utils/osDetection";

describe("osDetection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("detectOS", () => {
		it("returns 'windows' for win32 platform", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			expect(detectOS()).toBe("windows");
		});

		it("returns 'macos' for darwin platform", () => {
			vi.stubGlobal("process", { ...process, platform: "darwin" });
			expect(detectOS()).toBe("macos");
		});

		it("returns 'linux' for linux platform", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			expect(detectOS()).toBe("linux");
		});

		it("returns 'linux' for unknown platforms (fallback)", () => {
			vi.stubGlobal("process", { ...process, platform: "freebsd" });
			expect(detectOS()).toBe("linux");
		});
	});

	describe("detectLinuxDistro", () => {
		beforeEach(() => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
		});

		it("returns 'unknown' for non-linux OS", () => {
			vi.stubGlobal("process", { ...process, platform: "darwin" });
			expect(detectLinuxDistro()).toBe("unknown");
		});

		it("detects Ubuntu from /etc/os-release", () => {
			vi.mocked(childProcess.execSync).mockReturnValue(
				'ID=ubuntu\nVERSION="22.04"',
			);
			expect(detectLinuxDistro()).toBe("ubuntu");
		});

		it("detects Debian from /etc/os-release", () => {
			vi.mocked(childProcess.execSync).mockReturnValue(
				'ID=debian\nVERSION="11"',
			);
			expect(detectLinuxDistro()).toBe("debian");
		});

		it("detects Fedora from /etc/os-release", () => {
			vi.mocked(childProcess.execSync).mockReturnValue(
				'ID=fedora\nVERSION="38"',
			);
			expect(detectLinuxDistro()).toBe("fedora");
		});

		it("detects Arch from /etc/os-release", () => {
			vi.mocked(childProcess.execSync).mockReturnValue("ID=arch\n");
			expect(detectLinuxDistro()).toBe("arch");
		});

		it("detects CentOS from /etc/os-release", () => {
			vi.mocked(childProcess.execSync).mockReturnValue(
				'ID=centos\nVERSION="8"',
			);
			expect(detectLinuxDistro()).toBe("centos");
		});

		it("uses ID_LIKE fallback for Ubuntu derivatives", () => {
			vi.mocked(childProcess.execSync).mockReturnValue(
				'ID=linuxmint\nID_LIKE="ubuntu debian"',
			);
			expect(detectLinuxDistro()).toBe("debian");
		});

		it("falls back to package manager detection when /etc/os-release fails", () => {
			vi.mocked(childProcess.execSync)
				.mockImplementationOnce(() => {
					throw new Error("File not found");
				})
				.mockReturnValueOnce("/usr/bin/apt-get"); // which apt-get
			expect(detectLinuxDistro()).toBe("debian");
		});

		it("returns 'unknown' when all detection methods fail", () => {
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Command failed");
			});
			expect(detectLinuxDistro()).toBe("unknown");
		});
	});

	describe("isWSL", () => {
		it("returns false for non-linux OS", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			expect(isWSL()).toBe(false);
		});

		it("returns true when /proc/version contains 'microsoft'", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue(
				"Linux version 5.15.0-1-microsoft-standard-WSL2",
			);
			expect(isWSL()).toBe(true);
		});

		it("returns true when /proc/version contains 'wsl'", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue(
				"Linux version 5.15.0 WSL",
			);
			expect(isWSL()).toBe(true);
		});

		it("returns false for standard Linux", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue(
				"Linux version 5.15.0-generic",
			);
			expect(isWSL()).toBe(false);
		});

		it("returns false when /proc/version read fails", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("File not found");
			});
			expect(isWSL()).toBe(false);
		});
	});

	describe("getPackageManager", () => {
		it("returns 'choco' for Windows with Chocolatey", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			vi.mocked(childProcess.execSync).mockReturnValue("1.2.0");
			expect(getPackageManager()).toBe("choco");
		});

		it("returns 'unknown' for Windows without Chocolatey", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Command not found");
			});
			expect(getPackageManager()).toBe("unknown");
		});

		it("returns 'brew' for macOS with Homebrew", () => {
			vi.stubGlobal("process", { ...process, platform: "darwin" });
			vi.mocked(childProcess.execSync).mockReturnValue("Homebrew 4.0.0");
			expect(getPackageManager()).toBe("brew");
		});

		it("returns 'apt' for Ubuntu/Debian Linux", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue("ID=ubuntu\n");
			expect(getPackageManager()).toBe("apt");
		});

		it("returns 'dnf' for Fedora/CentOS Linux", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue("ID=fedora\n");
			expect(getPackageManager()).toBe("dnf");
		});

		it("returns 'pacman' for Arch Linux", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockReturnValue("ID=arch\n");
			expect(getPackageManager()).toBe("pacman");
		});

		it("returns 'unknown' when Linux distro detection fails", () => {
			vi.stubGlobal("process", { ...process, platform: "linux" });
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Detection failed");
			});
			expect(getPackageManager()).toBe("unknown");
		});
	});

	describe("getHomeDir", () => {
		it("returns a string path", () => {
			const homeDir = getHomeDir();
			expect(typeof homeDir).toBe("string");
			expect(homeDir.length).toBeGreaterThan(0);
		});
	});

	describe("isRoot", () => {
		it("returns boolean", () => {
			const result = isRoot();
			expect(typeof result).toBe("boolean");
		});

		it("returns false for Windows when not admin", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			vi.mocked(childProcess.execSync).mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(isRoot()).toBe(false);
		});

		it("returns true for Windows when running as admin", () => {
			vi.stubGlobal("process", { ...process, platform: "win32" });
			vi.mocked(childProcess.execSync).mockReturnValue("");
			expect(isRoot()).toBe(true);
		});

		it("checks getuid for Linux/macOS when root", () => {
			vi.stubGlobal("process", {
				...process,
				platform: "linux",
				getuid: () => 0,
			});
			expect(isRoot()).toBe(true);
		});

		it("checks getuid for Linux/macOS when not root", () => {
			vi.stubGlobal("process", {
				...process,
				platform: "linux",
				getuid: () => 1000,
			});
			expect(isRoot()).toBe(false);
		});
	});
});
