# Contributing to Talawa API
Thank you for your interest in contributing to Talawa API. Regardless of the size of the contribution you make, all contributions are welcome and are appreciated. 

If you are new to contributing to open source, please read the Open Source Guides on [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Ways to Contribute
If you are ready to start contributing code right away, we have a list of [good first issues](https://github.com/PalisadoesFoundation/talawa-api/labels/good%20first%20issue) that contain issues with a limited scope. 

## Quicklinks

* [Our Development Process](#Our-development-process)
    * [Issues](#issues)
    * [Pull Requests](#pull-requests)
    * [Git Flow](#git-flow)
* [Contributing Code](#contributing-code)
* [GSoC](#gsoc)
* [Community](#community)



### Our Development Process
We utilize GitHub issues and pull requests to keep track of issues and contributions from the community. 

#### Issues 
Make sure you are following [issue report guidelines](https://github.com/PalisadoesFoundation/talawa/blob/master/issue-guidelines.md) available here before creating any new issues on Talawa API project.

#### Pull Requests
[Pull Request guidelines](https://github.com/PalisadoesFoundation/talawa/blob/master/PR-guidelines.md) is best resource to follow to start working on open issues.

#### Git Flow
For Talawa API, we utilize the GitFlow branching model. GitFlow is geared towards efficiently tracking development and managing releases. The model makes parallel development efforts easy and safe by isolating new development efforts from completed work. 

The different types of branches we may use are:
* Feature branches (feature/branch-name)
* Release branches (release/1.XX)
* Bug branches  (bugfix/branch-name)
* Hotfix branches (hotfix/branch-name)

Detailed document containing how GitFlow works: https://nvie.com/posts/a-successful-git-branching-model/

### Contributing Code
Code contributions to Talawa come in the form of pull requests. These are done by forking the repo and making changes locally.

Make sure you have read the [Documentation for Setting up the Project](https://github.com/PalisadoesFoundation/talawa-api/blob/master/configuration.md)

The process of proposing a change to Talawa API can be summarized as:
1. Fork the Talawa API repository and branch off `master`.
2. The repository can be cloned locally using `git clone <forked repo url>`.
3. Make the desired changes to the Talawa API source.
4. Run the app and test your changes.
5. If you've added code that should be tested, write tests.
6. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
7. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
8. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
9. Now create a pull request to the Talawa repository from your forked repo. Open an issue regarding the same and link your PR to it.
10. Ensure the test suite passes, either locally or on CI once a PR has been created. 
11. Review and address comments on your pull request if requested.

### GSoC
If you are participating in the 2021 Summer of Code, please read more about us and our processes [here](http://www.palisadoes.org/gsoc/)

### Community
The Palisadoes Foundation has a Slack channel where members can assist with support and clarification. Click [here](https://join.slack.com/t/thepalisadoes-dyb6419/shared_invite/zt-nk79xxlg-OxTdlrD7RLaswu8EO_Q5rg) to join our slack channel.
