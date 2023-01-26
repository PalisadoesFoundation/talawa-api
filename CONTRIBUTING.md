# Contributing to Talawa API

Thank you for your interest in contributing to Talawa API. Regardless of the size of the contribution you make, all contributions are welcome and are appreciated.

If you are new to contributing to open source, please read the Open Source Guides on [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Our Development Process](#our-development-process)
  - [Issues](#issues)
  - [Pull Requests](#pull-requests)
  - [Branching Strategy](#branching-strategy)
- [Contributing Code](#contributing-code)
- Internships
  - [GSoC](#gsoc)
- [Community](#community)

## Code of Conduct

A safe environment is required for everyone to contribute. Read our [Code of Conduct Guide](CODE_OF_CONDUCT.md) to understand what this means. Let us know immediately if you have unacceptable experiences in this area.

No one should fear voicing their opinion. Respones must be respectful.

## Ways to Contribute

If you are ready to start contributing code right away, get ready!

1. Join our Slack and introduce yourself. See details on how to join below in the Community section.
   1. This repository has its own dedicated channel.
   1. There are many persons on the various channels who are willing to assist you in getting started.
1. Take a look at our issues (**_after reading our guidelines below_**):
   1. We have a list of [good first issues](https://github.com/PalisadoesFoundation/talawa-api/labels/good%20first%20issue) that contain challenges with a limited scope for beginners.
   1. There are issues for creating tests for our code base. We need to increase reliablility. Try those issues, or create your own for files that don't already have tests. This is another good strategy for beginners.
   1. There are [dormant issues on which nobody has worked for some time](https://github.com/PalisadoesFoundation/talawa-api/issues?q=is%3Aopen+is%3Aissue+label%3Ano-issue-activity). These are another place to start
   1. There may also be [dormant PRs on which nobody has worked for some time](https://github.com/PalisadoesFoundation/talawa-api/issues?q=is%3Aopen+is%3Aissue+label%3Ano-issue-activity+label%3Ano-pr-activity)!
1. Create an issue based on a bug you have found or a feature you would like to add. We value meaningful sugestions and will prioritize them.

Welcome aboard!

### Our Development Process

We utilize GitHub issues and pull requests to keep track of issues and contributions from the community.

#### Issues

Make sure you are following [issue report guidelines](issue-guidelines.md) available here before creating any new issues on Talawa API project.

#### Pull Requests

[Pull Request guidelines](PR-guidelines.md) is best resource to follow to start working on open issues.

#### Branching Strategy

For Talawa API, we had employed the following branching strategy to simplify the development process and to ensure that only stable code is pushed to the `master` branch:

- `develop`: For unstable code and bug fixing
- `alpha-x.x.x`: For stability testing
- `master`: Where the stable production ready code lies

### Contributing Code

Code contributions to Talawa come in the form of pull requests. These are done by forking the repo and making changes locally.

Make sure you have read the [Documentation for Setting up the Project](./INSTALLATION.md)

The process of proposing a change to Talawa API can be summarized as:

1. Fork the Talawa API repository and branch off `develop`.
1. The repository can be cloned locally using `git clone <forked repo url>`.
1. Make the desired changes to the Talawa API source.
1. Run the app and test your changes.
1. If you've added code, then test suites must be added.
   1. **_General_:**
      1. We need to get to 100% test coverage for the app. We periodically increase the desired test coverage for our pull requests to meet this goal.
      1. Pull requests that don't meet the minimum test coverage levels will not be accepted. This may mean that you will have to create tests for code you did not write. You can decide which part of the code base needs additional tests if this happens to you.
   1. **_Testing_:**
      1. Test using these commands (All tests):
         ```
         npm run test
         genhtml coverage/lcov.info -o coverage
         ```
      1. Test using these commands (Single test):
         ```
         npm run test -- -t <Name_of_Test>
         ```
      1. Here are some useful testing resources:
         1. Documentation:
            1. [Jest testing documentation](https://jestjs.io/docs/expect)
            1. The [organizations.spec.js](tests/resolvers/organization_query/organizations.spec.js) test file is a well documented example of what to do for resolver tests.
         1. Videos:
            1. [Introduction To Testing In JavaScript With Jest](https://www.youtube.com/watch?v=FgnxcUQ5vho)
            1. [Jest Crash Course](https://www.youtube.com/watch?v=7r4xVDI2vho)
            1. [Testing NodeJS applications with JEST](https://www.youtube.com/watch?v=8gHEv5iNRKk)
1. **_Test Code Coverage_:**
   1. _General Information_
      1. The current code coverage of the repo is: [![codecov](https://codecov.io/gh/PalisadoesFoundation/talawa-api/branch/develop/graph/badge.svg?token=CECBQTAOKM)](https://codecov.io/gh/PalisadoesFoundation/talawa-api)
      1. You can determine the percentage test coverage of your code by running these two commands in sequence:
         ```
         npm install
         npm run test
         genhtml coverage/lcov.info -o coverage
         ```
      1. The coverage rate will be visible on the penultimate line of the `genhtml` command's output.
      1. The `genhtml` command is part of the linux `lcov` package. Similar packages can be found for Windows and MacOS.
      1. The currently acceptable coverage rate can be found in the [GitHub Pull Request file](.github/workflows/pull-request.yml). Search for the value below the line containing `min_coverage`.
   1. _Creating your code coverage account_
      1. You can also see your code coverage online for your fork of the repo. This is provided by `codecov.io`
         1. Go to this link: `https://app.codecov.io/gh/XXXX/YYYY` where XXXX is your GitHub account username and YYYY is the name of the repository
         1. Login to `codecov.io` using your GitHub account, and add your **repo** and **branches** to the `codecov.io` dashboard.
         1. Remember to add the `Repository Upload Token` for your forked repo. This can be found under `Settings` of your `codecov.io` account.
         1. Use the value of this token to create a secret named CODE_COV for your forked repo.
         1. You will see your code coverage reports with every push to your repo after following these steps
1. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
1. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
1. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
1. Now create a pull request to the Talawa repository from your forked repo. Open an issue regarding the same and link your PR to it.
1. Ensure the test suite passes, either locally or on CI once a PR has been created.
1. Review and address comments on your pull request if requested.

## Internships

We have internship partnerships with a number of organizations. See below for more details.

### GSoC

If you are participating in the Summer of Code, please read more about us and our processes [here](https://docs.talawa.io/docs/internships/gsoc/gsoc-introduction)

## Community

There are many ways to communicate with the community.

1. The Palisadoes Foundation has a Slack channel where members can assist with support and clarification. Visit the [Talawa GitHub repository home page](https://github.com/PalisadoesFoundation/talawa) for the link to join our slack channel.
1. We also have a technical email list run by [freelists.org](https://www.freelists.org/). Search for "palisadoes" and join. Members on this list are also periodically added to our marketing email list that focuses on less technical aspects of our work.
