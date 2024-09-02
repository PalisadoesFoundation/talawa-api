#!/usr/bin/bash

CODECOV_UNIQUE_NAME="CODECOV_UNIQUE_NAME-10661135982-4047"
CHANGED_FILES="config/vitestSetup.ts setup.ts src/resolvers/Mutation/updateAgendaCategory.ts tests/helpers/userAndOrg.ts tests/resolvers/UserTag/childTags.spec.ts tests/resolvers/UserTag/usersAssignedTo.spec.ts tests/resolvers/middleware/currentUserExists.spec.ts"

# Run ESLint on the changed files
npx eslint ${CHANGED_FILES}