// in jest.config.js
module.exports = {
  // extends time taken before the request times out to 30000ms
  testTimeout: 30000,
  collectCoverage: true,
  testEnvironment: 'node',
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['lib/**/*.js*'],
  coveragePathIgnorePatterns: ['/node_modules/', 'lib/helper_lib'],
};
