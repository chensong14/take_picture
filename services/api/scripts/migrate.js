const fs = require('node:fs/promises')
const path = require('node:path')
const { pool } = require('../src/db/pool')

async function run() {
  const migrationDir = path.resolve(__dirname, '../../../database/migrations')
  const files = (await fs.readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationDir, file), 'utf8')
    const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean)
    for (const statement of statements) await pool.query(statement)
    console.log(`applied ${file}`)
  }
  await pool.end()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
