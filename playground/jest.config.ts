export default {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['dist', 'src/generated', 'e2e-test'],
  resetMocks: true,
  roots: ['integration-tests'],
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/unit',
        outputName: 'unit-test-results.xml',
      },
    ],
  ],
  testEnvironment: 'node',
}
