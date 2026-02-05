module.exports = {
  apps: [
    {
      name: 'rep-api',
      script: 'dist/index.js',
      instances: '4',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        ROLE: 'api',
      },
    },
    {
      name: 'rep-bridge',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ROLE: 'bridge',
      },
    },
  ],
};
