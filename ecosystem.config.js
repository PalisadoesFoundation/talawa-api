module.exports = {
  apps: [
    {
      name: 'app',
      script: 'index.js',
      watch: '.',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
