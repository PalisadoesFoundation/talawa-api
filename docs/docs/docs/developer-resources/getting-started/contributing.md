---
id: contributing
title: Contributing
slug: /developer-resources/contributing
sidebar_position: 15
---

Please read the [Palisadoes Contributing Guidelines](https://developer.palisadoes.org/docs/contributor-guide/contributing) for a complete guide on how to get started with submitting code.

For complete documentation including test sharding, code coverage setup, debugging, and git hooks, visit the [Testing Guide](../testing/testing-validation.md).

## Making Contributions   

1. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
1. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
1. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
1. Now create a pull request to the Talawa-admin repository from your forked repo. Open an issue regarding the same and link your PR to it.
1. Ensure the test suite passes, either locally or on CI once a PR has been created.
1. Review and address comments on your pull request if requested.
