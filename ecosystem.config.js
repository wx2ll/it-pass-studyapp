module.exports = {
  apps: [{
    name: 'vocab-app',
    cwd: '/root/.openclaw/workspace/vocabapp',
    script: 'npm',
    args: 'start -- -p 4000',
    env: {
      NODE_ENV: 'production',
      PORT: '4000'
    },
    autorestart: true,
    watch: false,
    exp_backoff_restart_delay: 100
  }]
}
