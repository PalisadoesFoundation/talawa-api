#!/usr/bin/env python3
# ruff: noqa: PT009
"""Test suite for check_sanitization_disable.py validator.

This module provides comprehensive test coverage for the sanitization disable
comment validator, ensuring it correctly identifies invalid comments and
handles edge cases.

Note: PT009 (pytest-unittest-assertion) is suppressed because this file
intentionally uses unittest.TestCase assertion methods.
"""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

# Add the scripts directory to the path
sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        ".github",
        "workflows",
        "scripts",
    ),
)

# pylint: disable=wrong-import-position
from check_sanitization_disable import (
    check_files,
    check_sanitization_disable,
)


class TestCheckSanitizationDisable(unittest.TestCase):
    """Test cases for check_sanitization_disable function."""

    def setUp(self):
        """Create temporary directory for test files."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        """Clean up temporary directory."""
        self.temp_dir.cleanup()

    def _create_test_file(
        self, content: str, filename: str = "test.ts"
    ) -> str:
        """Create a temporary test file with given content.

        Args:
            content: File content to write
            filename: Name of the file to create

        Returns:
            str: Path to the created file

        """
        file_path = self.temp_path / filename
        file_path.write_text(content, encoding="utf-8")
        return str(file_path)

    # Valid cases tests
    def test_valid_comment_with_adequate_justification(self):
        """Test valid disable comment with adequate justification."""  # noqa: E501
        content = """
// check-sanitization-disable: system-generated URL field
import { t } from "graphql";

t.string({ resolve: () => "url" });
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertFalse(is_invalid)
        self.assertEqual(error_message, "")

    def test_valid_comment_with_exactly_10_characters(self):
        """Test edge case: justification with exactly 10 characters."""
        content = """
// check-sanitization-disable: 1234567890
import { t } from "graphql";
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertFalse(is_invalid)
        self.assertEqual(error_message, "")

    def test_valid_comment_with_long_justification(self):
        """Test valid disable comment with long justification."""
        content = """
// check-sanitization-disable: OAuth tokens are system-generated
import { t } from "graphql";
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertFalse(is_invalid)
        self.assertEqual(error_message, "")

    def test_file_without_disable_comment(self):
        """Test that files without disable comment are valid."""
        content = """
import { escapeHTML } from "~/src/utilities/sanitizer";
import { t } from "graphql";

t.string({ resolve: () => escapeHTML("safe") });
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertFalse(is_invalid)
        self.assertEqual(error_message, "")

    # Invalid cases tests
    def test_missing_justification_no_colon(self):
        """Test that disable comment without colon/justification fails."""
        content = """
// check-sanitization-disable
import { t } from "graphql";
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertTrue(is_invalid)
        self.assertIn("missing justification", error_message)
        self.assertIn(
            "Format: // check-sanitization-disable: <reason>", error_message
        )

    def test_short_justification_9_chars(self):
        """Test that justification with <10 characters fails."""
        content = """
// check-sanitization-disable: 123456789
import { t } from "graphql";
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertTrue(is_invalid)
        self.assertIn("Justification too short", error_message)
        self.assertIn("9 chars", error_message)
        self.assertIn("Minimum 10 characters required", error_message)

    def test_short_justification_1_char(self):
        """Test that very short justification (1 char) fails."""
        content = """
// check-sanitization-disable: x
import { t } from "graphql";
"""
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertTrue(is_invalid)
        self.assertIn("Justification too short", error_message)
        self.assertIn("1 chars", error_message)

    def test_empty_justification_after_colon(self):
        """Test that justification with only whitespace fails."""
        # Whitespace after colon - strips to empty, treated as missing
        content = "// check-sanitization-disable:  "
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertTrue(is_invalid)
        self.assertIn("missing justification", error_message)

    def test_colon_with_no_text(self):
        """Test that disable comment with colon but no text fails."""
        # Edge case: colon present but nothing after it (not even space)
        content = "// check-sanitization-disable:"
        file_path = self._create_test_file(content)
        is_invalid, error_message = check_sanitization_disable(file_path)

        self.assertTrue(is_invalid)
        self.assertIn("missing justification", error_message)

    def test_mixed_case_not_matched(self):
        """Test that mixed-case variants are not recognized (case-sensitive)."""
        # Mixed-case variants should NOT match the pattern
        test_cases = [
            "// Check-Sanitization-Disable: valid justification text",
            "// CHECK-SANITIZATION-DISABLE: valid justification text",
            "// check-Sanitization-disable: valid justification text",
            "// Check-sanitization-disable: valid justification text",
        ]

        for content in test_cases:
            file_path = self._create_test_file(content)
            is_invalid, error_message = check_sanitization_disable(file_path)

            # Should return valid (False) because the pattern doesn't match
            # Therefore no validation occurs
            self.assertFalse(
                is_invalid,
                f"Mixed-case variant should not be matched: {content}",
            )
            self.assertEqual(error_message, "")

    # File handling tests
    def test_file_not_found_error(self):
        """Test FileNotFoundError behavior."""
        non_existent_path = str(self.temp_path / "nonexistent.ts")

        is_invalid, error_message = check_sanitization_disable(
            non_existent_path
        )

        # Should fail validation when file cannot be found
        self.assertTrue(is_invalid)
        self.assertIn("File not found", error_message)
        self.assertIn(non_existent_path, error_message)

    def test_permission_error(self):
        """Test PermissionError behavior."""
        file_path = self._create_test_file("content")

        with patch(
            "builtins.open", side_effect=PermissionError("Access denied")
        ):
            is_invalid, error_message = check_sanitization_disable(file_path)

            # Should fail validation when permission is denied
            self.assertTrue(is_invalid)
            self.assertIn("Permission denied", error_message)
            self.assertIn(file_path, error_message)

    def test_os_error(self):
        """Test generic OSError behavior."""
        file_path = self._create_test_file("content")

        with patch("builtins.open", side_effect=OSError("Disk error")):
            is_invalid, error_message = check_sanitization_disable(file_path)

            # Should fail validation when OS error occurs
            self.assertTrue(is_invalid)
            self.assertIn("Error reading file", error_message)
            self.assertIn(file_path, error_message)


class TestCheckFiles(unittest.TestCase):
    """Test cases for check_files function."""

    def setUp(self):
        """Create temporary directory for test files."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        """Clean up temporary directory."""
        self.temp_dir.cleanup()

    def _create_test_file(
        self, content: str, filename: str, subdir: str | None = None
    ) -> str:
        """Create a temporary test file with given content.

        Args:
            content: File content to write
            filename: Name of the file to create
            subdir: Optional subdirectory path

        Returns:
            str: Path to the created file

        """
        if subdir:
            dir_path = self.temp_path / subdir
            dir_path.mkdir(parents=True, exist_ok=True)
            file_path = dir_path / filename
        else:
            file_path = self.temp_path / filename

        file_path.write_text(content, encoding="utf-8")
        return str(file_path)

    def test_check_single_valid_file(self):
        """Test checking a single valid .ts file."""
        content = "// check-sanitization-disable: valid reason here"
        file_path = self._create_test_file(content, "valid.ts")

        with patch("builtins.print"):
            has_errors = check_files([file_path])

        self.assertFalse(has_errors)

    def test_check_single_invalid_file(self):
        """Test checking a single invalid .ts file."""
        content = "// check-sanitization-disable"
        file_path = self._create_test_file(content, "invalid.ts")

        with patch("builtins.print") as mock_print:
            has_errors = check_files([file_path])

        self.assertTrue(has_errors)
        # Verify error message was printed
        self.assertTrue(mock_print.called)
        error_output = str(mock_print.call_args_list)
        self.assertIn("❌", error_output)
        self.assertIn("missing justification", error_output)

    def test_check_non_ts_file_ignored(self):
        """Test that non-.ts files are ignored."""
        content = "// check-sanitization-disable"
        js_file = self._create_test_file(content, "file.js")

        with patch("builtins.print"):
            has_errors = check_files([js_file])

        # Non-.ts file should be ignored, no errors
        self.assertFalse(has_errors)

    def test_directory_with_nested_ts_files(self):
        """Test directory traversal with nested .ts files."""
        # Create valid file in root
        self._create_test_file(
            "// check-sanitization-disable: valid reason", "valid.ts"
        )

        # Create nested directory structure
        nested_dir = "src/graphql/types"
        self._create_test_file(
            "// check-sanitization-disable",
            "invalid.ts",
            nested_dir,
        )

        with patch("builtins.print") as mock_print:
            has_errors = check_files([str(self.temp_path)])

        self.assertTrue(has_errors)
        # Should report error for nested invalid file
        error_output = str(mock_print.call_args_list)
        self.assertIn("invalid.ts", error_output)

    def test_node_modules_exclusion(self):
        """Test that node_modules directories are excluded."""
        # Create file in node_modules
        self._create_test_file(
            "// check-sanitization-disable",
            "package.ts",
            "node_modules/package",
        )

        # Create valid file in src
        self._create_test_file(
            "// check-sanitization-disable: valid reason",
            "valid.ts",
            "src",
        )

        with patch("builtins.print"):
            has_errors = check_files([str(self.temp_path)])

        # Should not report errors (node_modules ignored, src is valid)
        self.assertFalse(has_errors)

    def test_multiple_files_with_errors(self):
        """Test checking multiple files, some with errors."""
        valid_file = self._create_test_file(
            "// check-sanitization-disable: valid reason", "valid.ts"
        )
        invalid_file1 = self._create_test_file(
            "// check-sanitization-disable", "invalid1.ts"
        )
        invalid_file2 = self._create_test_file(
            "// check-sanitization-disable: short", "invalid2.ts"
        )

        with patch("builtins.print") as mock_print:
            has_errors = check_files(
                [valid_file, invalid_file1, invalid_file2]
            )

        self.assertTrue(has_errors)
        # Should report both invalid files
        error_output = str(mock_print.call_args_list)
        self.assertIn("invalid1.ts", error_output)
        self.assertIn("invalid2.ts", error_output)


class TestArguments(unittest.TestCase):
    """Test cases for CLI argument handling."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        """Clean up."""
        self.temp_dir.cleanup()

    def test_files_mode_vs_directory_mode(self):
        """Test that --files takes precedence over --directory."""
        # Create test files
        file1 = self.temp_path / "file1.ts"
        file1.write_text(
            "// check-sanitization-disable: valid reason",
            encoding="utf-8",
        )

        dir_path = self.temp_path / "dir"
        dir_path.mkdir()
        file2 = dir_path / "file2.ts"
        file2.write_text(
            "// check-sanitization-disable",  # Invalid
            encoding="utf-8",
        )

        # When --files is provided, should only check those files
        with patch("builtins.print"):
            has_errors = check_files([str(file1)])

        self.assertFalse(has_errors)  # file1 is valid

        # When directory is provided, should check all .ts files in directory
        with patch("builtins.print") as mock_print:
            has_errors = check_files([str(dir_path)])

        self.assertTrue(has_errors)  # file2 is invalid
        error_output = str(mock_print.call_args_list)
        self.assertIn("file2.ts", error_output)


if __name__ == "__main__":
    unittest.main()
