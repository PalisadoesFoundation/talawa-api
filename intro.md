# AI Assistant Context - Navya's Open Source Contributions

## About This Project
I'm **Navya** contributing to **Talawa API** - an open source project by the Palisadoes Foundation.

**Repository**: https://github.com/PalisadoesFoundation/talawa-api  
**My Fork**: https://github.com/NavyasreeBalu/talawa-api  
**Documentation**: https://docs.talawa.io

## Project Overview
**Talawa** is a modular open source platform for managing group activities of non-profit organizations and businesses.

**Core Features**:
- Membership management
- Groups management  
- Event registrations
- Recurring meetings
- Facilities registrations

## Technical Stack
- **Backend**: Node.js with GraphQL API
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest
- **Linting/Formatting**: Biome
- **Development**: Docker-based environment
- **Language**: TypeScript

## My Development Environment
- **OS**: Linux (WSL2 on Windows)
- **Working Directory**: `/home/navya/openSource/talawa-api`
- **Development Method**: Docker containers
- **Branch Strategy**: Work on `develop` branch, create feature branches

## Repository Structure
```
talawa-api/
├── src/                    # Main source code
│   ├── graphql/types/      # GraphQL type definitions
│   ├── resolvers/          # GraphQL resolvers
│   └── utilities/          # Helper functions
├── test/                   # Test files
│   ├── graphql/types/      # GraphQL type tests
│   └── helpers/            # Test utilities
├── drizzle/               # Database migrations
└── docs/                  # Documentation
```

## Git Configuration
```bash
# Remotes
origin    -> NavyasreeBalu/talawa-api (my fork)
upstream  -> PalisadoesFoundation/talawa-api (main repo)

# Branch Strategy
develop   -> base branch (never work on main)
feature/* -> my working branches
```

## Common Issue Types I Work On
- **Test Coverage**: Adding tests to reach 100% coverage
- **Bug Fixes**: Fixing reported issues
- **Features**: Adding new functionality
- **Documentation**: Improving docs and comments
- **Refactoring**: Code improvements and optimizations

## Development Workflow
1. **Pick an issue** from GitHub (comment to claim it)
2. **Create feature branch** from `develop`
3. **Code in Docker environment** 
4. **Test locally** with `npm run test`
5. **Format code** with `npm run format:fix`
6. **Submit PR** targeting `develop` branch

## Key Files for Reference
- `workflow.md` - My complete development workflow
- `intro.md` - This context file

## Current Contribution Stats
- **Active Contributor** to Talawa API
- **Focus Areas**: Test coverage, GraphQL resolvers, bug fixes
- **Goal**: Consistent contributions to open source ecosystem

---

**Note for AI Assistant**: This context should help you understand my project setup, development environment, and contribution patterns. Use this information to provide more targeted and relevant assistance, ask the user if any clarification questions.
