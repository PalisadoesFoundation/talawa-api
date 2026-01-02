# Talawa API

💬 Join our [community forum](https://community.talawa.io/) to meet others using and improving Talawa!

[![N|Solid](docs/static/img/markdown/misc/talawa-logo-lite-200x200.png)](https://github.com/PalisadoesFoundation/talawa-api)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub stars](https://img.shields.io/github/stars/PalisadoesFoundation/talawa-api.svg?style=social&label=Star&maxAge=2592000)](https://github.com/PalisadoesFoundation/talawa-api)
[![GitHub forks](https://img.shields.io/github/forks/PalisadoesFoundation/talawa-api.svg?style=social&label=Fork&maxAge=2592000)](https://github.com/PalisadoesFoundation/talawa-api)
[![codecov](https://codecov.io/gh/PalisadoesFoundation/talawa-api/branch/develop/graph/badge.svg?token=CECBQTAOKM)](https://codecov.io/gh/PalisadoesFoundation/talawa-api)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Linted with Biome](https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

Talawa is a modular open source project to manage group activities of both non-profit organizations and businesses.

Core features include:

1.  Membership management
2.  Groups management
3.  Event registrations
4.  Recurring meetings
5.  Facilities registrations

`talawa` is based on the original `quito` code created by the [Palisadoes Foundation](http://www.palisadoes.org) as part of its annual Calico Challenge program. Calico provides paid summer internships for Jamaican university students to work on selected open source projects. They are mentored by software professionals and receive stipends based on the completion of predefined milestones. Calico was started in 2015. Visit [The Palisadoes Foundation's website](http://www.palisadoes.org/) for more details on its origin and activities.

## Table of Contents

<!-- toc -->

- [Talawa Components](#talawa-components)
- [Documentation](#documentation)
  - [Videos](#videos)

<!-- tocstop -->

## Talawa Components

`talawa` has these major software components:

1. **talawa**: [A mobile application with social media features](https://github.com/PalisadoesFoundation/talawa)
1. **talawa-api**: [An API providing access to user data and features](https://github.com/PalisadoesFoundation/talawa-api)
1. **talawa-admin**: [A web based administrative portal](https://github.com/PalisadoesFoundation/talawa-admin)
1. **talawa-plugin**: [Microkernel-based drop-in plugins for Talawa-Admin](https://github.com/PalisadoesFoundation/talawa-plugin)
1. **talawa-docs**: [The online documentation website](https://github.com/PalisadoesFoundation/talawa-docs)

## Features

- **GraphQL API** with full support for queries, mutations, and subscriptions
- **Built-in Performance Monitoring** with Server-Timing headers and metrics endpoint
- **DataLoader Integration** for efficient batch loading and N+1 query prevention
- **Redis Caching** with automatic performance tracking and hit/miss ratios
- **Plugin System** for extending functionality with custom modules
- **Role-Based Access Control** for secure multi-tenant operations
- **Event Management** with recurring events and materialized views
- **Real-time Chat** with WebSocket support
- **File Upload** with MinIO integration

# Documentation

1. You can install the software for this repository using the steps in our [INSTALLATION.md](INSTALLATION.md) file.
1. Do you want to contribute to our code base? Look at our [CONTRIBUTING.md](CONTRIBUTING.md) file to get started. There you'll also find links to:
   1. Our code of conduct documentation in the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file.
   1. How we handle the processing of new and existing issues in our [ISSUE_GUIDELINES.md](ISSUE_GUIDELINES.md) file.
   1. The methodologies we use to manage our pull requests in our [PR_GUIDELINES.md](PR_GUIDELINES.md) file.
1. The `talawa` documentation can be found at our [docs.talawa.io](https://docs.talawa.io) site.
   1. It is automatically generated from the markdown files stored in our [Talawa-Docs GitHub repository](https://github.com/PalisadoesFoundation/talawa-docs). This makes it easy for you to update our documenation.

## Videos

1. Visit our [YouTube Channel playlists](https://www.youtube.com/@PalisadoesOrganization/playlists) for more insights
   1. The "[Getting Started - Developers](https://www.youtube.com/watch?v=YpBUoHxEeyg&list=PLv50qHwThlJUIzscg9a80a9-HmAlmUdCF&index=1)" videos are extremely helpful for new open source contributors.
      <- Update verification script guidance Trigger CI -->
