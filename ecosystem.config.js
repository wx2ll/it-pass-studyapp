module.exports = {
  apps: [
    {
      name: 'studyapp',
      script: 'npm',
      args: 'start -- -p 4000',
      cwd: '/root/.openclaw/workspace/studyapp',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'webhook',
      script: 'webhook-server.js',
      cwd: '/root/.openclaw/workspace/studyapp',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
}