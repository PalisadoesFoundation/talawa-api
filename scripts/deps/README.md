# Dependency Analysis and Management Scripts

This document consolidates the steps and explanations for analyzing and managing dependencies in a Node.js project using the provided scripts.

---

## Overview

These scripts help analyze the difference between production and development dependencies and ensure that all required dependencies are correctly categorized in the `package.json` file. They also support moving dev-only dependencies used in production to the `dependencies` section.

### Purpose
1. **Analyze Dependencies:** Identify dev-only and prod-only dependencies.
2. **Categorize Dependencies:** Ensure all production-required dependencies are moved from `devDependencies` to `dependencies`.
3. **Prune Unused Dev Dependencies:** Reduce the size of the final production build.

---

## Prerequisites

1. **Install `jq`**
   - `jq` is required for processing JSON files. Install it using the following commands based on your operating system:
     - **Alpine Linux**: `apk add --no-cache jq`
     - **Debian/Ubuntu**: `apt-get update && apt-get install -y jq`
     - **RHEL/CentOS**: `yum install -y jq`
     - **MacOS (with Homebrew)**: `brew install jq`
     - **Windows**: Download the appropriate binary from [jq's official website](https://stedolan.github.io/jq/download/).

2. **Ensure Scripts Are Executable**
   - Make the scripts executable:
     ```sh
     chmod +x ./scripts/deps/analyze-dependencies.sh
     chmod +x ./scripts/deps/move-from-diff.sh
     ```

3. **Set Up npm**
   - Ensure `npm` is installed and configured properly in the environment.

4. **Optional: Simplified Execution**
   - If you don't want to run the scripts manually, use the following command, which is defined in `package.json`:
     ```sh
     npm run move-and-prune
     ```
   - This command runs both scripts and executes `npm prune --omit=dev` to remove unnecessary development dependencies.

---

## Usage

### Step 1: Analyze Dependencies

1. **Run the `analyze-dependencies.sh` Script**
   - Navigate to the project root directory (where `package.json` is located).
   - Execute:
     ```sh
     ./scripts/deps/analyze-dependencies.sh
     ```
   - **What It Does:**
     - Generates the following files in the `scripts/deps` folder:
       - `prod-deps.json`: Top-level production dependencies.
       - `dev-deps.json`: Top-level dev+prod dependencies.
       - `prod-deps-keys.json`: Keys of production dependencies.
       - `dev-deps-keys.json`: Keys of dev+prod dependencies.
     - Displays the differences between production and dev dependencies.

2. **Output Files**
   - The results are saved in the `scripts/deps` folder for further processing.

---

### Step 2: Move Required Dev Dependencies

1. **Run the `move-from-diff.sh` Script**
   - Execute:
     ```sh
     ./scripts/deps/move-from-diff.sh
     ```
   - **What It Does:**
     - Compares `prod-deps-keys.json` and `dev-deps-keys.json`.
     - Identifies dev-only dependencies used in the production code.
     - Moves required dependencies from `devDependencies` to `dependencies` in `package.json`.

2. **Validation**
   - The script checks if a dependency is used in the production code (default: `./src` folder).
   - Modify the script if your codebase structure differs.

---

### Step 3: Prune Unused Dev Dependencies

1. **Run npm prune**
   - After moving dependencies, remove unused dev dependencies:
     ```sh
     npm prune --omit=dev
     ```
   - **Purpose:**
     - Ensures the `node_modules` folder contains only production dependencies.

---

## Combined Execution

To automate the above steps:

- Use the `npm run move-and-prune` command, which:
  1. Runs both `analyze-dependencies.sh` and `move-from-diff.sh`.
  2. Executes `npm prune --omit=dev` to clean up unused development dependencies.

---

## Notes

- Ensure your production code resides in `./src` folders. Update the scripts if your codebase structure differs.
- Always test the changes locally before deploying them to production to avoid runtime errors.

