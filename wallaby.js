module.exports = () => {
  return {
    files: ['index.js'],
    tests: ['index.test.js'],
    env: {
      type: 'node',
      runner: 'node'
    },
    testFramework: 'jest'
  }
}
