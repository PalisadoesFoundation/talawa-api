/**
 * Logger Utilities for Installation Scripts
 */

/** ANSI color codes */
const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",

	// Foreground colors
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
};

/** Logger configuration */
let verboseMode = false;

/**
 * Set verbose mode for logging
 */
export function setVerbose(enabled: boolean): void {
	verboseMode = enabled;
}

/**
 * Format a message with color
 */
function colorize(message: string, color: keyof typeof colors): string {
	return `${colors[color]}${message}${colors.reset}`;
}

/**
 * Log an info message (blue)
 */
export function info(message: string): void {
	console.log(`${colorize("ℹ", "blue")} ${message}`);
}

/**
 * Log a success message (green)
 */
export function success(message: string): void {
	console.log(`${colorize("✓", "green")} ${message}`);
}

/**
 * Log a warning message (yellow)
 */
export function warn(message: string): void {
	console.log(`${colorize("⚠", "yellow")} ${message}`);
}

/**
 * Log an error message (red)
 */
export function error(message: string): void {
	console.error(`${colorize("✗", "red")} ${message}`);
}

/**
 * Log a debug message (dim, only in verbose mode)
 */
export function debug(message: string): void {
	if (verboseMode) {
		console.log(`${colorize("→", "dim")} ${message}`);
	}
}

/**
 * Log a step message (cyan, bold)
 */
export function step(
	stepNumber: number,
	totalSteps: number,
	message: string,
): void {
	const prefix = colorize(`[${stepNumber}/${totalSteps}]`, "cyan");
	console.log(`${prefix} ${colorize(message, "bold")}`);
}

/**
 * Log a header/section message
 */
export function header(title: string): void {
	const line = "=".repeat(50);
	console.log("");
	console.log(colorize(line, "magenta"));
	console.log(colorize(`  ${title}`, "magenta"));
	console.log(colorize(line, "magenta"));
	console.log("");
}

/**
 * Log a sub-header message
 */
export function subHeader(title: string): void {
	console.log("");
	console.log(colorize(`── ${title} ──`, "cyan"));
}

/**
 * Log a command that is being executed
 */
export function command(cmd: string): void {
	console.log(`${colorize("$", "dim")} ${colorize(cmd, "white")}`);
}

/**
 * Log a key-value pair
 */
export function keyValue(key: string, value: string): void {
	console.log(`  ${colorize(`${key}:`, "dim")} ${value}`);
}

/**
 * Print a blank line
 */
export function blank(): void {
	console.log("");
}

/**
 * Print the installation banner
 */
export function banner(): void {
	const bannerText = `
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ████████╗ █████╗ ██╗      █████╗ ██╗    ██╗ █████╗   ║
║   ╚══██╔══╝██╔══██╗██║     ██╔══██╗██║    ██║██╔══██╗  ║
║      ██║   ███████║██║     ███████║██║ █╗ ██║███████║  ║
║      ██║   ██╔══██║██║     ██╔══██║██║███╗██║██╔══██║  ║
║      ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║  ██║  ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ║
║                                                        ║
║              One-Click Installation Script             ║
╚════════════════════════════════════════════════════════╝
`;
	console.log(colorize(bannerText, "cyan"));
}
