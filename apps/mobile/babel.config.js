module.exports = (api) => {
  api.cache(true)

  // Ensure Expo Router can statically analyze require.context in monorepo setups.
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync'

  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
  }
}
