import { checkDatabaseConnection } from '../config/db.js';

export async function getDatabaseHealth() {
  await checkDatabaseConnection();
  return { status: 'ok', database: 'connected' };
}
