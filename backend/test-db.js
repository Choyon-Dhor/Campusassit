const db = require('./config/database');

async function main() {
  const connected = await db.testConnection();
  process.exit(connected ? 0 : 1);
}

main();
