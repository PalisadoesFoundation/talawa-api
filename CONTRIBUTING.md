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

## Development with Docker Rootless

If you are using Docker in Rootless mode, this project provides a dedicated devcontainer configuration (`.devcontainer/rootless/devcontainer.json`).

**Critical Requirements:**

1.  **Environment Variables**: You must ensure `UID` and `XDG_RUNTIME_DIR` are set on your host.
    *   Bash/Zsh:
        ```bash
        export UID=$(id -u)
        export XDG_RUNTIME_DIR=/run/user/$UID
        ```
2.  **Socket Mounting**: The configuration uses `docker/compose.rootless.devcontainer.yaml` to mount your host's Docker socket from `${XDG_RUNTIME_DIR:-/run/user/${UID}}/docker.sock` to `/var/run/docker.sock` inside the container.
3.  **User Mapping**: The container runs as `root` internally. However, due to Rootless Docker's user namespace remapping, files created by this `root` user on bind mounts will be owned by your non-root host user.

**Troubleshooting:**

*   **Permission Denied**: If the container cannot access the Docker socket, verify that `XDG_RUNTIME_DIR` points to the directory containing your user's `docker.sock` and that you have read/write permissions.
*   **Socket Path**: Ensure your `DOCKER_HOST` matches the path constructed by the variables.

For full installation instructions, see [INSTALLATION.md](docs/docs/docs/getting-started/installation.md).

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
1. Review and address comments on your pull request if requested.
