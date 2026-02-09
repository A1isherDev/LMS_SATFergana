const createJestConfig = require('next/jest').default

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
        '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
        '^@/config/(.*)$': '<rootDir>/src/config/$1',
    },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
