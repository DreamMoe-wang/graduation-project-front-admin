const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // Fixes build failures like "spawn EPERM" in restricted environments
  // and improves compatibility with newer Node runtimes.
  parallel: false,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true
      }
    }
  }
})
