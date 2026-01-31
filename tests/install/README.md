# About this directory

This directory contains the test suite for the **shell installation scripts** in `scripts/install/`. The layout mirrors `scripts/install/`: `common/`, `macos/`, and `linux/` with `*.test.sh` files that source and exercise the scripts under `scripts/install/`.

# Directory structure

- **common/** – Tests for shared helpers: validation, logging, package-manager, docker-detection, error-handling, os-detection.
- **macos/** – Tests for the macOS install script (`install-macos.sh`).
- **linux/** – Tests for the Linux install script (`install-linux.sh`).

Tests must be run from the repository root (or with paths such that `scripts/install/` is reachable). Each `*.test.sh` resolves the repo root and sources scripts from `scripts/install/`.

# Running tests

**Run all install script tests (from repo root):**

```bash
pnpm test:install
```

Or run the runner script directly:

```bash
./tests/install/run-all.sh
```

**Run a single test file (from repo root):**

```bash
./tests/install/common/validation.test.sh
./tests/install/macos/install-macos.test.sh
```

# Coverage

In CI, install script tests are run under [kcov](https://github.com/SimonKagstrom/kcov); coverage for `scripts/install/` is uploaded to Codecov with the `install` flag. The 95% patch coverage target for the install flag is configured in `codecov.yml`.

# Requirements

- **Bash 4.0+** for most tests (some use bash 3.2+).
- **jq** (optional): required for `parse_package_json` functional tests in `validation.test.sh`; those tests are skipped if `jq` is not installed.

See also: [scripts/install/common/README.md](../../scripts/install/common/README.md) for script behavior and validation details.
