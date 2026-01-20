#!/usr/bin/env python3
"""Test suite for disable_statements_check.py.

This module tests the DisableStatementsChecker class that validates
disable statements in API and Admin code.
"""

import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add the scripts directory to the path
SCRIPTS_DIR = (
    Path(__file__).parent.parent.parent / ".github" / "workflows" / "scripts"
)
sys.path.insert(0, str(SCRIPTS_DIR))

from disable_statements_check import DisableStatementsChecker  # noqa: E402


class TestDisableStatementsChecker(unittest.TestCase):
    """Test cases for DisableStatementsChecker class."""

    def setUp(self):
        """Set up test fixtures."""
        self.checker = DisableStatementsChecker()
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        # Clean up temp files
        import shutil

        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def _create_temp_file(self, filename: str, content: str) -> str:
        """Create a temporary file with given content."""
        filepath = os.path.join(self.temp_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return filepath

    # ========== check_eslint_disable Tests ==========

    def test_check_eslint_disable_found(self):
        """Test eslint-disable detection."""
        content = "// eslint-disable no-console\nconst x = 1;"
        violations = self.checker.check_eslint_disable(content, "test.js")
        self.assertEqual(len(violations), 1)
        self.assertIn("test.js:1", violations[0])
        self.assertIn("eslint-disable", violations[0])

    def test_check_eslint_disable_case_insensitive(self):
        """Test eslint-disable is case-insensitive."""
        content = "// ESLINT-DISABLE no-console\nconst x = 1;"
        violations = self.checker.check_eslint_disable(content, "test.js")
        self.assertEqual(len(violations), 1)

    def test_check_eslint_disable_not_found(self):
        """Test when no eslint-disable is present."""
        content = "const x = 1;\nconsole.log(x);"
        violations = self.checker.check_eslint_disable(content, "test.js")
        self.assertEqual(len(violations), 0)

    # ========== check_biome_disable Tests ==========

    def test_check_biome_disable_found(self):
        """Test biome-ignore detection."""
        content = "// biome-ignore lint/suspicious/noExplicitAny: temp\nconst x: any = 1;"
        violations = self.checker.check_biome_disable(content, "test.ts")
        self.assertEqual(len(violations), 1)
        self.assertIn("test.ts:1", violations[0])
        self.assertIn("biome-ignore", violations[0])

    def test_check_biome_disable_multiline(self):
        """Test biome-ignore on multiple lines."""
        content = """
// biome-ignore lint: temp
const x = 1;
// biome-ignore format: temp
const y = 2;
"""
        violations = self.checker.check_biome_disable(content, "test.ts")
        self.assertEqual(len(violations), 2)

    def test_check_biome_disable_not_found(self):
        """Test when no biome-ignore is present."""
        content = "const x = 1;"
        violations = self.checker.check_biome_disable(content, "test.ts")
        self.assertEqual(len(violations), 0)

    # ========== check_ts_ignore Tests ==========

    def test_check_ts_ignore_single_line(self):
        """Test @ts-ignore single-line comment detection."""
        content = "// @ts-ignore\nconst x = 1;"
        violations = self.checker.check_ts_ignore(content, "test.ts")
        self.assertEqual(len(violations), 1)
        self.assertIn("test.ts:1", violations[0])

    def test_check_ts_ignore_block_comment(self):
        """Test @ts-ignore block comment detection."""
        content = "/* @ts-ignore */\nconst x = 1;"
        violations = self.checker.check_ts_ignore(content, "test.ts")
        self.assertEqual(len(violations), 1)

    def test_check_ts_ignore_not_found(self):
        """Test when no @ts-ignore is present."""
        content = "const x: number = 1;"
        violations = self.checker.check_ts_ignore(content, "test.ts")
        self.assertEqual(len(violations), 0)

    # ========== check_sanitization_disable Tests ==========

    def test_check_sanitization_disable_valid(self):
        """Test valid sanitization disable with proper justification."""
        content = "// check-sanitization-disable: legacy code needs refactoring first\nconst x = 1;"
        violations = self.checker.check_sanitization_disable(
            content, "test.ts"
        )
        self.assertEqual(len(violations), 0)

    def test_check_sanitization_disable_missing_justification(self):
        """Test sanitization disable without justification."""
        content = "// check-sanitization-disable\nconst x = 1;"
        violations = self.checker.check_sanitization_disable(
            content, "test.ts"
        )
        self.assertEqual(len(violations), 1)
        self.assertIn("missing justification", violations[0])

    def test_check_sanitization_disable_short_justification(self):
        """Test sanitization disable with too short justification."""
        content = "// check-sanitization-disable: short\nconst x = 1;"
        violations = self.checker.check_sanitization_disable(
            content, "test.ts"
        )
        self.assertEqual(len(violations), 1)
        self.assertIn("too short", violations[0])
        self.assertIn("5 chars", violations[0])

    def test_check_sanitization_disable_case_sensitive(self):
        """Test that sanitization disable is case-sensitive."""
        # This should NOT match because it's uppercase
        content = (
            "// CHECK-SANITIZATION-DISABLE: uppercase version\nconst x = 1;"
        )
        violations = self.checker.check_sanitization_disable(
            content, "test.ts"
        )
        self.assertEqual(len(violations), 0)

    # ========== check_istanbul_ignore Tests ==========

    def test_check_istanbul_ignore_single_line(self):
        """Test istanbul ignore single-line comment detection."""
        content = "// istanbul ignore next\nfunction test() {}"
        violations = self.checker.check_istanbul_ignore(content, "test.ts")
        self.assertEqual(len(violations), 1)
        self.assertIn("test.ts:1", violations[0])

    def test_check_istanbul_ignore_block_comment(self):
        """Test istanbul ignore block comment detection."""
        content = "/* istanbul ignore next */\nfunction test() {}"
        violations = self.checker.check_istanbul_ignore(content, "test.ts")
        self.assertEqual(len(violations), 1)

    def test_check_istanbul_ignore_variations(self):
        """Test various istanbul ignore variations."""
        content = """
// istanbul ignore next
const x = 1;
/* istanbul ignore next */
const y = 2;
"""
        violations = self.checker.check_istanbul_ignore(content, "test.ts")
        self.assertEqual(len(violations), 2)

    def test_check_istanbul_ignore_not_found(self):
        """Test when no istanbul ignore is present."""
        content = "function test() { return true; }"
        violations = self.checker.check_istanbul_ignore(content, "test.ts")
        self.assertEqual(len(violations), 0)

    # ========== check_it_skip Tests ==========

    def test_check_it_skip_found(self):
        """Test it.skip detection."""
        content = 'it.skip("test", () => {});'
        violations = self.checker.check_it_skip(content, "test.test.ts")
        self.assertEqual(len(violations), 1)
        self.assertIn("test.test.ts:1", violations[0])

    def test_check_it_skip_case_sensitive(self):
        """Test it.skip is case-sensitive (should only match lowercase)."""
        content = 'It.Skip("test", () => {});'
        violations = self.checker.check_it_skip(content, "test.test.ts")
        # Should be 0 because it.skip is case-sensitive now
        self.assertEqual(len(violations), 0)

    def test_check_it_skip_not_found(self):
        """Test when no it.skip is present."""
        content = 'it("test", () => {});'
        violations = self.checker.check_it_skip(content, "test.test.ts")
        self.assertEqual(len(violations), 0)

    # ========== check_file Tests ==========

    def test_check_file_skips_self(self):
        """Test that the script skips checking itself."""
        filepath = self._create_temp_file(
            "disable_statements_check.py", "// biome-ignore\nconst x = 1;"
        )
        violations = self.checker.check_file(filepath, repo="api")
        self.assertEqual(len(violations), 0)

    def test_check_file_api_repo_checks(self):
        """Test API-specific checks are run."""
        filepath = self._create_temp_file(
            "test.ts", "// biome-ignore lint: temp\nconst x = 1;"
        )
        violations = self.checker.check_file(filepath, repo="api")
        # Should find biome-ignore
        self.assertGreater(len(violations), 0)

    def test_check_file_admin_repo_skips_api_checks(self):
        """Test that Admin repo skips API-specific checks."""
        filepath = self._create_temp_file(
            "test.ts", "// biome-ignore lint: temp\nconst x = 1;"
        )
        violations = self.checker.check_file(filepath, repo="admin")
        # Should NOT find biome-ignore (API-specific check)
        biome_violations = [v for v in violations if "biome" in v.lower()]
        self.assertEqual(len(biome_violations), 0)

    def test_check_file_api_repo_skips_eslint(self):
        """Test that API repo skips eslint checks."""
        filepath = self._create_temp_file(
            "test.js", "// eslint-disable no-console\nconst x = 1;"
        )
        violations = self.checker.check_file(filepath, repo="api")
        # Should NOT find eslint-disable (Admin-specific check)
        eslint_violations = [v for v in violations if "eslint" in v.lower()]
        self.assertEqual(len(eslint_violations), 0)

    def test_check_file_test_file_skips_istanbul(self):
        """Test that test files skip istanbul ignore check."""
        filepath = self._create_temp_file(
            "myfile.test.ts", "/* istanbul ignore next */\nfunction test() {}"
        )
        violations = self.checker.check_file(filepath, repo="api")
        # Should NOT find istanbul ignore in test files
        istanbul_violations = [
            v for v in violations if "istanbul" in v.lower()
        ]
        self.assertEqual(len(istanbul_violations), 0)

    def test_check_file_non_test_file_finds_istanbul(self):
        """Test that non-test files check for istanbul ignore."""
        filepath = self._create_temp_file(
            "myfile.ts", "/* istanbul ignore next */\nfunction test() {}"
        )
        violations = self.checker.check_file(filepath, repo="api")
        # Should find istanbul ignore in non-test files
        istanbul_violations = [
            v for v in violations if "istanbul" in v.lower()
        ]
        self.assertEqual(len(istanbul_violations), 1)

    def test_check_file_read_error(self):
        """Test error handling for unreadable files."""
        # Try to read a non-existent file
        violations = self.checker.check_file(
            "/nonexistent/file.ts", repo="api"
        )
        self.assertEqual(len(violations), 1)
        self.assertIn("Error reading file", violations[0])

    # ========== check_files Tests ==========

    def test_check_files_multiple(self):
        """Test checking multiple files."""
        file1 = self._create_temp_file(
            "file1.ts", "// biome-ignore lint: temp\nconst x = 1;"
        )
        file2 = self._create_temp_file(
            "file2.ts", "// @ts-ignore\nconst y = 2;"
        )
        violations = self.checker.check_files([file1, file2], repo="api")
        # Should find violations in both files
        self.assertGreaterEqual(len(violations), 2)

    def test_check_files_empty_list(self):
        """Test checking empty list of files."""
        violations = self.checker.check_files([], repo="api")
        self.assertEqual(len(violations), 0)

    # ========== check_directory Tests ==========

    def test_check_directory_finds_files(self):
        """Test directory checking finds TypeScript files."""
        self._create_temp_file(
            "file1.ts", "// biome-ignore lint: temp\nconst x = 1;"
        )
        self._create_temp_file("file2.tsx", "// @ts-ignore\nconst y = 2;")
        violations = self.checker.check_directory(self.temp_dir, repo="api")
        # Should find violations in directory
        self.assertGreater(len(violations), 0)

    def test_check_directory_skips_non_js_files(self):
        """Test directory checking skips non-JS/TS files."""
        # Create a Python file
        self._create_temp_file("file.py", "# biome-ignore\nprint('hello')")
        violations = self.checker.check_directory(self.temp_dir, repo="api")
        # Should not check Python files
        self.assertEqual(len(violations), 0)

    # ========== Integration Tests ==========

    def test_multiple_violations_in_single_file(self):
        """Test file with multiple different violations."""
        content = """
// biome-ignore lint: temp
const x = 1;

// @ts-ignore
const y = 2;

/* istanbul ignore next */
function test() {}

// check-sanitization-disable: bad
const z = 3;
"""
        filepath = self._create_temp_file("multiple.ts", content)
        violations = self.checker.check_file(filepath, repo="api")
        # Should find: biome-ignore, @ts-ignore, istanbul, sanitization (too short)
        self.assertGreaterEqual(len(violations), 4)

    def test_clean_file_no_violations(self):
        """Test clean file with no violations."""
        content = """
const x: number = 1;
const y: string = "hello";

function test(): boolean {
    return true;
}
"""
        filepath = self._create_temp_file("clean.ts", content)
        violations = self.checker.check_file(filepath, repo="api")
        self.assertEqual(len(violations), 0)


if __name__ == "__main__":
    unittest.main()
