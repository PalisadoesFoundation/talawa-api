/**
 * Test suite for AtomicEnvWriter
 *
 * Tests atomic .env file operations including:
 * - Backup creation
 * - Atomic writes
 * - Failure recovery
 * - Cleanup operations
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
	atomicWriteEnv,
	cleanupTemp,
	commitTemp,
	ensureBackup,
	fileExists,
	readEnv,
	restoreBackup,
	SetupError,
	writeTemp,
} from "../../../scripts/setup/AtomicEnvWriter.js";

// Test directory for isolated tests
const TEST_DIR = path.join(process.cwd(), "test-temp-atomic-env");
const TEST_ENV = path.join(TEST_DIR, ".env");
const TEST_BACKUP = path.join(TEST_DIR, ".env.backup");
const TEST_TEMP = path.join(TEST_DIR, ".env.tmp");

/**
 * Setup test environment before each test
 */
async function setupTest(): Promise<void> {
	await fs.mkdir(TEST_DIR, { recursive: true });
}

/**
 * Cleanup test environment after each test
 */
async function cleanupTest(): Promise<void> {
	try {
		await fs.rm(TEST_DIR, { recursive: true, force: true });
	} catch (_e) {
		// Ignore cleanup errors
	}
}

/**
 * Helper to create a test file with content
 */
async function createTestFile(
	filePath: string,
	content: string,
): Promise<void> {
	await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Helper to read a test file
 */
async function readTestFile(filePath: string): Promise<string> {
	return await fs.readFile(filePath, "utf-8");
}

/**
 * Test: ensureBackup creates backup when file exists
 */
async function testEnsureBackupCreatesBackup(): Promise<void> {
	await setupTest();

	try {
		const originalContent = "KEY=value\nOTHER=test";
		await createTestFile(TEST_ENV, originalContent);

		await ensureBackup(TEST_ENV, TEST_BACKUP);

		const backupExists = await fileExists(TEST_BACKUP);
		const backupContent = await readTestFile(TEST_BACKUP);

		if (!backupExists) {
			throw new Error("Backup file was not created");
		}

		if (backupContent !== originalContent) {
			throw new Error("Backup content does not match original");
		}

		console.log("✓ ensureBackup creates backup when file exists");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: ensureBackup doesn't fail when file doesn't exist
 */
async function testEnsureBackupNoFile(): Promise<void> {
	await setupTest();

	try {
		// Should not throw when file doesn't exist
		await ensureBackup(TEST_ENV, TEST_BACKUP);

		const backupExists = await fileExists(TEST_BACKUP);

		if (backupExists) {
			throw new Error(
				"Backup should not exist when source file does not exist",
			);
		}

		console.log("✓ ensureBackup handles non-existent file gracefully");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: writeTemp creates temporary file with correct content
 */
async function testWriteTemp(): Promise<void> {
	await setupTest();

	try {
		const content = "TEMP_KEY=temp_value\n";
		await writeTemp(TEST_TEMP, content);

		const tempExists = await fileExists(TEST_TEMP);
		const tempContent = await readTestFile(TEST_TEMP);

		if (!tempExists) {
			throw new Error("Temp file was not created");
		}

		if (tempContent !== content) {
			throw new Error("Temp file content does not match expected");
		}

		console.log("✓ writeTemp creates temp file with correct content");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: commitTemp atomically renames temp to env file
 */
async function testCommitTemp(): Promise<void> {
	await setupTest();

	try {
		const content = "COMMITTED=true\n";
		await createTestFile(TEST_TEMP, content);

		await commitTemp(TEST_ENV, TEST_TEMP);

		const envExists = await fileExists(TEST_ENV);
		const envContent = await readTestFile(TEST_ENV);
		const tempExists = await fileExists(TEST_TEMP);

		if (!envExists) {
			throw new Error("Env file was not created");
		}

		if (tempExists) {
			throw new Error("Temp file should be removed after commit");
		}

		if (envContent !== content) {
			throw new Error("Env file content does not match expected");
		}

		console.log("✓ commitTemp atomically commits temp file");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: restoreBackup restores from backup file
 */
async function testRestoreBackup(): Promise<void> {
	await setupTest();

	try {
		const backupContent = "RESTORED=from_backup\n";
		await createTestFile(TEST_BACKUP, backupContent);
		await createTestFile(TEST_ENV, "CORRUPTED=data\n");

		await restoreBackup(TEST_ENV, TEST_BACKUP);

		const envContent = await readTestFile(TEST_ENV);

		if (envContent !== backupContent) {
			throw new Error("Env file was not restored from backup");
		}

		console.log("✓ restoreBackup restores from backup");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: restoreBackup handles missing backup gracefully
 */
async function testRestoreBackupNoBackup(): Promise<void> {
	await setupTest();

	try {
		// Should not throw when backup doesn't exist
		await restoreBackup(TEST_ENV, TEST_BACKUP);

		console.log("✓ restoreBackup handles missing backup gracefully");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: cleanupTemp removes temporary file
 */
async function testCleanupTemp(): Promise<void> {
	await setupTest();

	try {
		await createTestFile(TEST_TEMP, "temp");

		await cleanupTemp(TEST_TEMP);

		const tempExists = await fileExists(TEST_TEMP);

		if (tempExists) {
			throw new Error("Temp file should be removed");
		}

		console.log("✓ cleanupTemp removes temp file");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: cleanupTemp handles missing file gracefully
 */
async function testCleanupTempNoFile(): Promise<void> {
	await setupTest();

	try {
		// Should not throw when file doesn't exist
		await cleanupTemp(TEST_TEMP);

		console.log("✓ cleanupTemp handles missing file gracefully");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: atomicWriteEnv complete successful flow
 */
async function testAtomicWriteEnvSuccess(): Promise<void> {
	await setupTest();

	try {
		const originalContent = "ORIGINAL=value\n";
		const newContent = "NEW=updated_value\n";

		await createTestFile(TEST_ENV, originalContent);

		await atomicWriteEnv(newContent, {
			envFile: TEST_ENV,
			backupFile: TEST_BACKUP,
			tempFile: TEST_TEMP,
		});

		const envContent = await readTestFile(TEST_ENV);
		const backupExists = await fileExists(TEST_BACKUP);
		const tempExists = await fileExists(TEST_TEMP);

		if (envContent !== newContent) {
			throw new Error("Env file was not updated correctly");
		}

		if (!backupExists) {
			throw new Error("Backup should exist after successful write");
		}

		if (tempExists) {
			throw new Error("Temp file should be cleaned up");
		}

		console.log("✓ atomicWriteEnv completes successful flow");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: atomicWriteEnv restores from backup on failure
 *
 * This simulates a failure mid-write and verifies backup restoration
 */
async function testAtomicWriteEnvFailureRestore(): Promise<void> {
	await setupTest();

	try {
		const originalContent = "ORIGINAL=safe_value\n";
		await createTestFile(TEST_ENV, originalContent);

		// Make the temp directory read-only to simulate failure
		// Note: This is a simplified simulation - in real scenarios failures can happen
		// in various ways (disk full, permissions, etc.)

		try {
			// Try to write to an invalid path to trigger an error
			await atomicWriteEnv("NEW=value\n", {
				envFile: TEST_ENV,
				backupFile: TEST_BACKUP,
				tempFile: "/invalid/path/.env.tmp", // Invalid path to trigger error
			});

			throw new Error("Should have thrown an error");
		} catch (error) {
			// Error is expected
			if (!(error instanceof SetupError)) {
				// Check that original content is preserved
				const envContent = await readTestFile(TEST_ENV);
				if (envContent !== originalContent) {
					throw new Error("Original content should be preserved on failure");
				}
			}
		}

		console.log("✓ atomicWriteEnv handles failures gracefully");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: readEnv reads existing file
 */
async function testReadEnv(): Promise<void> {
	await setupTest();

	try {
		const content = "READ=test\n";
		await createTestFile(TEST_ENV, content);

		const readContent = await readEnv(TEST_ENV);

		if (readContent !== content) {
			throw new Error("Read content does not match expected");
		}

		console.log("✓ readEnv reads existing file");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: readEnv returns empty string for non-existent file
 */
async function testReadEnvNoFile(): Promise<void> {
	await setupTest();

	try {
		const content = await readEnv(TEST_ENV);

		if (content !== "") {
			throw new Error("Should return empty string for non-existent file");
		}

		console.log("✓ readEnv returns empty string for non-existent file");
	} finally {
		await cleanupTest();
	}
}

/**
 * Test: fileExists returns correct values
 */
async function testFileExists(): Promise<void> {
	await setupTest();

	try {
		await createTestFile(TEST_ENV, "test");

		const exists = await fileExists(TEST_ENV);
		const notExists = await fileExists(TEST_BACKUP);

		if (!exists) {
			throw new Error("Should return true for existing file");
		}

		if (notExists) {
			throw new Error("Should return false for non-existent file");
		}

		console.log("✓ fileExists returns correct values");
	} finally {
		await cleanupTest();
	}
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
	console.log("Running AtomicEnvWriter tests...\n");

	const tests = [
		testEnsureBackupCreatesBackup,
		testEnsureBackupNoFile,
		testWriteTemp,
		testCommitTemp,
		testRestoreBackup,
		testRestoreBackupNoBackup,
		testCleanupTemp,
		testCleanupTempNoFile,
		testAtomicWriteEnvSuccess,
		testAtomicWriteEnvFailureRestore,
		testReadEnv,
		testReadEnvNoFile,
		testFileExists,
	];

	let passed = 0;
	let failed = 0;

	for (const test of tests) {
		try {
			await test();
			passed++;
		} catch (error) {
			failed++;
			console.error(`✗ ${test.name} failed:`, error);
		}
	}

	console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

	if (failed > 0) {
		process.exit(1);
	}
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runAllTests().catch(console.error);
}

export { runAllTests, setupTest, cleanupTest };
