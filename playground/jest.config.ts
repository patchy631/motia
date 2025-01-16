export default {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [],
  resetMocks: true,
  roots: ['integration-tests'],
  verbose: true,
  reporters: ['default', ['jest-junit', { outputDirectory: 'reports/unit', outputName: 'unit-test-results.xml' }]],
  testEnvironment: 'node',
}
