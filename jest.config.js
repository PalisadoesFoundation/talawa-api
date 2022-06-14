/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // extends time taken before the request times out to 30000ms
  testTimeout: 30000,
  collectCoverage: true,
  testEnvironment: 'node',
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['./src/lib/**/*.ts*', './src/lib/**/*.js*'],
  coveragePathIgnorePatterns: ['/node_modules/', './src/lib/helper_lib'],
  preset: 'ts-jest',
};
