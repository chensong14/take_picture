const app = require('./app')
const env = require('./config/env')
const { checkDatabase } = require('./db/pool')

async function start() {
  await checkDatabase()
  const server = app.listen(env.port, () => {
    console.log(`photo-service-api listening on http://127.0.0.1:${env.port}`)
  })

  const shutdown = async (signal) => {
    console.log(`${signal}: shutting down API`)
    server.close(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((error) => {
  console.error('API startup failed', error)
  process.exitCode = 1
})
