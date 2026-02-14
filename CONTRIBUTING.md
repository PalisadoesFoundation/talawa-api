# Contributing to Talawa-Admin

Thank you for your interest in contributing to Talawa Admin. Regardless of the size of the contribution you make, all contributions are welcome and are appreciated.

If you are new to contributing to open source, please read the Open Source Guides on [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Table of Contents

<!-- toc -->

- [Contributing to Talawa-Admin](#contributing-to-talawa-admin)
  - [Table of Contents](#table-of-contents)
  - [General](#general)
  - [Testing and Code Quality](#testing-and-code-quality)
    - [Quick Reference](#quick-reference)
  - [Making Contributions](#making-contributions)

<!-- tocstop -->

## General

Please read the [Palisadoes Contributing Guidelines](https://developer.palisadoes.org/docs/contributor-guide/contributing).

## Docker Devcontainer

This project provides two devcontainer configurations:

1. **Default mode** (`.devcontainer/default/devcontainer.json`): For standard Docker installations.
2. **Rootless mode** (`.devcontainer/rootless/devcontainer.json`): For Docker Rootless installations.

For full setup and usage instructions, see the [Installation Guide](docs/docs/docs/getting-started/installation.md). For troubleshooting, see the [Troubleshooting Guide](docs/docs/docs/developer-resources/testing/troubleshooting.md).

## Testing and Code Quality

Testing and code quality documentation can be found at these locations:

1. Online at https://docs-api.talawa.io/docs/developer-resources/testing-validation
1. In the local repository at [testing-validation.md](docs/docs/docs/developer-resources/testing/testing-validation.md) which is the source file for the web page.

## Making Contributions   

1. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
1. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
1. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
1. Now create a pull request to the Talawa-admin repository from your forked repo. Open an issue regarding the same and link your PR to it.
1. Ensure the test suite passes, either locally or on CI once a PR has been created.
2. Changes to code under `scripts/install/` must include or update tests in `tests/install/` in the same relative path.
1. Review and address comments on your pull request if requested.
