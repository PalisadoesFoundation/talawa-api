/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // extends time taken before the request times out to 30000ms
  testTimeout: 30000,
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['./src/lib/**/*.ts*'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    './src/lib/config/index.ts',
    './src/lib/directives/index.ts',
    './src/lib/libraries/index.ts',
    './src/lib/libraries/errors/index.ts',
    './src/lib/middleware/index.ts',
    './src/lib/models/index.ts',
    './src/lib/resolvers/index.ts',
    './src/lib/resolvers/DirectChat/index.ts',
    './src/lib/resolvers/DirectChatMessage/index.ts',
    './src/lib/resolvers/GroupChat/index.ts',
    './src/lib/resolvers/GroupChatMessage/index.ts',
    './src/lib/resolvers/MembershipRequest/index.ts',
    './src/lib/resolvers/Mutation/index.ts',
    './src/lib/resolvers/Organization/index.ts',
    './src/lib/resolvers/Query/index.ts',
    './src/lib/resolvers/Subscription/index.ts',
    './src/lib/typeDefs/',
  ],
  preset: 'ts-jest',
  // This disables type checking while running the tests. Type checking
  // while running the tests make them considerably slow.
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
