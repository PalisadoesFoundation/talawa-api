#!/usr/bin/env python3
"""Consolidated script to check for disable statements in code files.

This script checks for:
- eslint-disable comments (Admin-only)
- biome-ignore comments (API-only)
- @ts-ignore comments (API-only)
- check-sanitization-disable comments (API-only)
- istanbul ignore comments (shared)
- it.skip statements in test files (shared)

Usage:
    python disable_statements_check.py --repo=api --files file1.js file2.ts
    python disable_statements_check.py --repo=admin --directory src/
"""

import argparse
import inspect
import os
import re
import sys
from pathlib import Path


class DisableStatementsChecker:
    """Checker for various disable statements in code files."""

    def check_eslint_disable(self, content: str, file_path: str) -> list[str]:
        """Check for eslint-disable comments (Admin-specific).

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        pattern = re.compile(r"//\s*eslint-disable", re.IGNORECASE)

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            violations.append(
                f"{file_path}:{line_num}: Found eslint-disable comment"
            )

        return violations

    def check_biome_disable(self, content: str, file_path: str) -> list[str]:
        """Check for biome-ignore comments (API-specific).

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        pattern = re.compile(
            r"//\s*biome-ignore.*$", re.IGNORECASE | re.MULTILINE
        )

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            violations.append(
                f"{file_path}:{line_num}: Found biome-ignore comment. "
                "Please remove and ensure code adheres to Biome rules."
            )

        return violations

    def check_ts_ignore(self, content: str, file_path: str) -> list[str]:
        """Check for @ts-ignore comments (API-specific).

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        pattern = re.compile(r"(?://|/\*)\s*@ts-ignore(?:\s+|$)")

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            violations.append(
                f"{file_path}:{line_num}: Found @ts-ignore comment"
            )

        return violations

    def check_sanitization_disable(
        self, content: str, file_path: str
    ) -> list[str]:
        """Check for check-sanitization-disable comments (API-specific).

        IMPORTANT: Only lowercase form accepted, requires justification.

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        # Case-sensitive pattern to enforce canonical lowercase form
        pattern = re.compile(
            r"//\s*check-sanitization-disable(?:\s*:\s*(.*))?$",
            re.MULTILINE,
        )

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            justification = match.group(1)

            if not justification or not justification.strip():
                violations.append(
                    f"{file_path}:{line_num}: Sanitization disable comment "
                    "missing justification. Format: "
                    "// check-sanitization-disable: <reason>"
                )
            elif len(justification.strip()) < 10:
                violations.append(
                    f"{file_path}:{line_num}: Justification too short "
                    f"({len(justification.strip())} chars). "
                    "Minimum 10 characters required."
                )

        return violations

    def check_istanbul_ignore(self, content: str, file_path: str) -> list[str]:
        """Check for istanbul ignore comments (shared between API and Admin).

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        # Match both // and /* */ variants to support API patterns
        pattern = re.compile(
            r"//\s*istanbul\s+ignore(?:\s+(?:next|-line))?[^\n]*|"
            r"/\*\s*istanbul\s+ignore\s+(?:next|-line)\s*\*/",
            re.IGNORECASE,
        )

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            violations.append(
                f"{file_path}:{line_num}: Found istanbul ignore comment. "
                "Please add appropriate tests."
            )

        return violations

    def check_it_skip(self, content: str, file_path: str) -> list[str]:
        """Check for it.skip statements in test files.

        Args:
            content: File content to check.
            file_path: Path to the file being checked.

        Returns:
            violations: List of violation messages.
        """
        violations = []
        pattern = re.compile(r"\bit\.skip\s*\(")

        for match in pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            violations.append(
                f"{file_path}:{line_num}: Found it.skip statement"
            )

        return violations

    def check_file(self, file_path: str, repo: str = "admin") -> list[str]:
        """Check a single file for disable statements.

        Args:
            file_path: Path to the file to check.
            repo: Repository type ("api" or "admin") - determines which
                checks to run.

        Returns:
            violations: List of violation messages.
        """
        # Skip checking this script itself and Python test files
        basename = os.path.basename(file_path)
        if basename == "disable_statements_check.py" or file_path.endswith(
            ".py"
        ):
            return []

        # Check if it's a test file
        is_test_file = file_path.endswith(
            (".test.ts", ".spec.ts", ".test.tsx", ".spec.tsx")
        )

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()
        except (OSError, UnicodeDecodeError) as e:
            return [f"{file_path}: Error reading file - {e}"]

        violations = []

        # Auto-discover check methods
        for name, method in inspect.getmembers(
            self, predicate=inspect.ismethod
        ):
            if name.startswith("check_") and name not in (
                "check_file",
                "check_files",
                "check_directory",
            ):
                # Skip repo-specific checks
                if repo == "api" and name == "check_eslint_disable":
                    continue
                if repo == "admin" and name in (
                    "check_biome_disable",
                    "check_ts_ignore",
                    "check_sanitization_disable",
                ):
                    continue

                # Skip coverage checks for test files
                if is_test_file and name == "check_istanbul_ignore":
                    continue

                violations.extend(method(content, file_path))

        return violations

    def check_files(
        self, file_paths: list[str], repo: str = "admin"
    ) -> list[str]:
        """Check multiple files for disable statements.

        Args:
            file_paths: List of file paths to check.
            repo: Repository type ("api" or "admin").

        Returns:
            all_violations: List of violation messages from all files.
        """
        all_violations = []
        for file_path in file_paths:
            violations = self.check_file(file_path, repo=repo)
            all_violations.extend(violations)
        return all_violations

    def check_directory(
        self, directory: str, repo: str = "admin"
    ) -> list[str]:
        """Check all relevant files in a directory.

        Args:
            directory: Directory path to check recursively.
            repo: Repository type ("api" or "admin").

        Returns:
            violations: List of violation messages from all files in directory.
        """
        extensions = {".js", ".jsx", ".ts", ".tsx"}
        file_paths = []

        for ext in extensions:
            file_paths.extend(Path(directory).rglob(f"*{ext}"))

        return self.check_files([str(p) for p in file_paths], repo=repo)


def main() -> None:
    """Execute the main functionality of the disable statements checker.

    Args:
        None

    Returns:
        None
    """
    parser = argparse.ArgumentParser(
        description="Check for disable statements in code files"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--files", nargs="+", help="Files to check")
    group.add_argument("--directory", help="Directory to check recursively")

    parser.add_argument(
        "--repo",
        choices=["api", "admin"],
        default="admin",
        help="Repository type (determines which checks to run)",
    )

    args = parser.parse_args()

    checker = DisableStatementsChecker()

    if args.files:
        violations = checker.check_files(args.files, repo=args.repo)
    else:
        violations = checker.check_directory(args.directory, repo=args.repo)

    if violations:
        for violation in violations:
            print(violation)
        sys.exit(1)
    else:
        print(f"No disable statements found ({args.repo} checks).")


if __name__ == "__main__":
    main()
