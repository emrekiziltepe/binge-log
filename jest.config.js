module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],
    setupFiles: ['./jest.setup.js'],
    collectCoverageFrom: [
        'components/**/*.{js,jsx}',
        'screens/**/*.{js,jsx}',
        'hooks/**/*.{js,jsx}',
        'services/**/*.{js,jsx}',
        'utils/**/*.{js,jsx}',
        'contexts/**/*.{js,jsx}',
        '!**/*.test.{js,jsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
};
