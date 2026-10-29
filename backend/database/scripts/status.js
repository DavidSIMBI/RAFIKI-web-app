import {
  closeDatabasePool,
  getMigrationStatus,
  withDatabaseConnection,
} from '../migrationRunner.js';

try {
  const statuses = await withDatabaseConnection(getMigrationStatus);
  if (statuses.length === 0) {
    console.log('No migration files found.');
  } else {
    for (const migration of statuses) {
      console.log(`${migration.status.padEnd(7)} ${migration.name}`);
    }
  }
} catch {
  console.error('Could not read migration status. Check the database connection and migration checksums.');
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
