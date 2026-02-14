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

**Verify no temp files leaked (run install tests in isolated TMPDIR, then check it is empty):**

```bash
pnpm test:install:no-leaks
# or: bash tests/install/check-no-leaks.sh
```

**Pre-commit:** When you stage any `tests/install/**/*.test.sh` file, lefthook runs `tests/install/check-traps.sh` to ensure every `*.test.sh` has an EXIT trap.

# Execution model

**Parallel execution is not supported.** Test files (e.g. `install-linux.test.sh`, `install-macos.test.sh`) use a single shared temporary directory and mocks per file; tests within a file run sequentially and rely on that shared state. `run-all.sh` runs test files one after another. Do not run the same test file in parallel or modify the runner for parallel execution without refactoring tests to use unique state per test.

# Environment isolation

Some test files set **global** `PATH` and `TERM` at load time (e.g. `export PATH="$MOCK_BIN:$PATH"`) so that later code can assume mocks are on `PATH`. `run-all.sh` invokes each test file with `bash`, so there is no cross-file PATH pollution.

For tests that invoke the **install script** (or any script under test), use an **isolated subshell** so the script sees a clean environment and only the mocks you intend. Recommended pattern:

```bash
env -i \
    PATH="$MOCK_BIN:/usr/bin:/bin" \
    MOCK_BIN="$MOCK_BIN" \
    HOME="$HOME" \
    USER="$USER" \
    TERM="dumb" \
    bash --noprofile --norc -c "cd '$TEST_DIR' && './scripts/install/...' ..."
```

This ensures the script under test runs with no inherited env from the test process; add or remove variables as needed for the test. See `tests/install/macos/install-macos.test.sh` (e.g. the helper that uses `env -i`) for a full example.

# Coverage

In CI, install script tests are run under [bashcov](https://github.com/infertux/bashcov); coverage for `scripts/install/` is uploaded to Codecov with the `install` flag. The install flag is configured in `codecov.yml`.

# Requirements

- **Bash 4.0+** for most tests (some use bash 3.2+).
- **jq** (optional): required for `parse_package_json` functional tests in `validation.test.sh`; those tests are skipped if `jq` is not installed.
- **Coverage (bashcov)** uses Ruby 3.x and Bundler; the Gemfile uses a patched simplecov (see `.github/workflows/pull-request.yml` step "Prepare simplecov for Ruby 3.2"). To run `bundle exec bashcov` locally with Ruby 3.2, run the same clone-and-patch of simplecov into `tests/install/vendor/simplecov` first, or rely on CI.

See also: [scripts/install/common/README.md](../../scripts/install/common/README.md) for script behavior and validation details.
