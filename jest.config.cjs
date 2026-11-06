module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { url: 'http://localhost/' },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/node_modules/react-router-dom/dist/index.js',
    '^react-router/dom$': '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
    '\\.(png|webp|svg|ico)$': '<rootDir>/src/test/fileMock.cjs',
  },
};
