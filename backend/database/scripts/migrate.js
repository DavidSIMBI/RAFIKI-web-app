import { closeDatabasePool, migrate } from '../migrationRunner.js';

try {
  await migrate();
  console.log('Migration run complete.');
} catch {
  console.error('Migration failed. Check the development database configuration and migration state.');
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
