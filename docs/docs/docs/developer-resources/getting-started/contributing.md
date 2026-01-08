---
id: contributing
title: Contributing
slug: /developer-resources/contributing
sidebar_position: 15
---

Please read the [Palisadoes Contributing Guidelines](https://developer.palisadoes.org/docs/contributor-guide/contributing) for a complete guide on how to get started with submitting code.

### Formatting

- **`format:check`**  
  Checks code formatting and lint rules using **Biome** without modifying any files.  
  The command fails if formatting issues or warnings are detected, making it suitable for CI validation.

- **`format:fix`**  
  Automatically fixes formatting and lint issues using **Biome** according to the project's configured rules.  
  The command fails if any warnings remain after applying fixes. Developers are encouraged to run this before committing changes.

### Linting

- **`lint:sanitization`**  
  Runs a custom security linter that enforces XSS protection in GraphQL resolvers.  
  Ensures all string-returning resolvers use `escapeHTML()` to sanitize user-generated content before returning it, preventing Cross-Site Scripting vulnerabilities.

- **`lint:tsdoc`**  
  Validates TSDoc comment syntax in TypeScript files using a custom script based on `@microsoft/tsdoc`.  
  Filters out overly pedantic rules (like requiring escaped curly braces in type examples) to maintain documentation readability while ensuring TSDoc compliance.

### Testing

- **`run_tests`**  
  Runs the full test suite with coverage reporting using Vitest.  
  Executes all tests with a single worker to ensure consistent execution order and complete coverage metrics.

- **`check_tests`**  
  Runs the test suite without coverage reporting for faster execution.  
  Useful for quick validation during development without the overhead of coverage collection.

- **`test:shard`**  
  Runs tests in parallel shards for faster CI execution using environment variables `SHARD_INDEX` and `SHARD_COUNT`.  
  Splits the test suite across multiple workers, enabling parallel test execution in CI pipelines. Requires shard configuration in CI; defaults to single shard locally.

- **`test:shard:coverage`**  
  Runs tests in parallel shards with code coverage reporting enabled.  
  Combines sharded test execution with coverage metrics. Configure using `SHARD_INDEX` and `SHARD_COUNT` environment variables.

### Quick Reference

**Testing:**
- Run all tests: `pnpm run test`
- Run specific test: `pnpm run test /path/to/test/file`
- Run with coverage: `pnpm run test:coverage`
- Run with sharding: `pnpm run test:shard`

**Linting and Formatting:**
- Fix linting issues: `pnpm run lint:fix`
- Fix formatting issues: `pnpm run format:fix`
- Check linting: `pnpm run lint:check`
- Check formatting: `pnpm run format:check`
For complete documentation including test sharding, code coverage setup, debugging, and git hooks, visit the [Testing Guide](../testing/testing-validation.md).

## Making Contributions   

1. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
1. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
1. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
1. Now create a pull request to the Talawa-admin repository from your forked repo. Open an issue regarding the same and link your PR to it.
1. Ensure the test suite passes, either locally or on CI once a PR has been created.
1. Review and address comments on your pull request if requested.
