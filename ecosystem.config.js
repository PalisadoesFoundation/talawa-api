module.exports = {
  apps: [
    {
      name: 'app',
      script: 'index.js',
      watch: '.',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
      },
    },
  ],
};
