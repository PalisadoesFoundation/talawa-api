---
name:  Test Implementation Request
about: Write tests for an existing file in the project
title: "Test: [File Name]"
labels: testing
assignees: ""
---
# Goal
The goal of this issue is to improve the code coverage for the file: `Example: src/resolvers/Chat/messages.ts`
# Tasks
1. Review the file to identify sections of code that are being ignored by Codecov or are not covered by tests.
2. Create or update test cases to ensure 100% coverage for the file.
3. Remove any `/* istanbul ignore */` or equivalent statements that bypass code coverage reporting, unless absolutely necessary.
# Resources
- Refer to the foundational documentation on writing test cases in the repository.
- Check the [Codecov report](https://app.codecov.io/gh/PalisadoesFoundation/talawa-api/tree/develop-postgres/src?displayType=list) for details on the uncovered lines.
# Acceptance Criteria
- All sections of the file are covered by tests.
- Code coverage for the file reaches 100%.
- PR created with necessary updates, passing all checks and reviews.
**Potential internship candidates**
Please read this if you are planning to apply for a Palisadoes Foundation internship 
- https://github.com/PalisadoesFoundation/talawa/issues/359
