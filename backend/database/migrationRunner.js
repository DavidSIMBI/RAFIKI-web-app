import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config/env.js';
import { pool } from '../src/config/db.js';

const databaseDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(databaseDirectory, 'migrations');
const migrationPattern = /^\d{12}_[a-z0-9_]+\.sql$/;
const historyTable = 'schema_migrations';

export async function listMigrations() {
  const names = (await readdir(migrationsDirectory))
    .filter((name) => migrationPattern.test(name))
    .sort();

  return Promise.all(names.map(async (name) => {
    const sql = await readFile(join(migrationsDirectory, name), 'utf8');
    return {
      name,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    };
  }));
}

function assertDevelopmentDatabase() {
  if (config.nodeEnv !== 'development' || !/_dev$/.test(config.db.database)) {
    throw new Error('Migrations are allowed only in development with a database name ending in _dev.');
  }
}

async function hasHistoryTable(connection) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [historyTable],
  );
  return rows.length > 0;
}

async function createHistoryTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${historyTable} (
      name VARCHAR(255) NOT NULL,
      checksum CHAR(64) NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (name)
    ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

export async function getMigrationStatus(connection) {
  const migrations = await listMigrations();
  const trackerExists = await hasHistoryTable(connection);
  const [rows] = trackerExists
    ? await connection.execute(`SELECT name, checksum, applied_at FROM ${historyTable} ORDER BY name`)
    : [[]];
  const applied = new Map(rows.map((row) => [row.name, row]));
  const migrationNames = new Set(migrations.map((migration) => migration.name));
  const unknownAppliedMigrations = rows.filter((row) => !migrationNames.has(row.name));
  if (unknownAppliedMigrations.length > 0) {
    throw new Error(`Migration files are missing for applied entries: ${unknownAppliedMigrations.map((row) => row.name).join(', ')}.`);
  }

  return migrations.map((migration) => {
    const record = applied.get(migration.name);
    if (record && record.checksum !== migration.checksum) {
      throw new Error(`Checksum mismatch for applied migration ${migration.name}.`);
    }
    return { name: migration.name, status: record ? 'applied' : 'pending' };
  });
}

export async function migrate() {
  assertDevelopmentDatabase();
  const connection = await pool.getConnection();

  try {
    const trackerExists = await hasHistoryTable(connection);
    if (!trackerExists) {
      const [tables] = await connection.execute(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`,
      );
      if (tables.length > 0) {
        throw new Error('Refusing to initialize migrations in a database that already contains tables.');
      }
    }

    await createHistoryTable(connection);
    const migrations = await listMigrations();
    const [appliedRows] = await connection.execute(`SELECT name, checksum FROM ${historyTable}`);
    const applied = new Map(appliedRows.map((row) => [row.name, row.checksum]));
    const migrationNames = new Set(migrations.map((migration) => migration.name));
    if (appliedRows.some((row) => !migrationNames.has(row.name))) {
      throw new Error('Migration history contains an entry without a matching migration file.');
    }

    for (const migration of migrations) {
      const previousChecksum = applied.get(migration.name);
      if (previousChecksum) {
        if (previousChecksum !== migration.checksum) {
          throw new Error(`Checksum mismatch for applied migration ${migration.name}.`);
        }
        continue;
      }

      const statements = migration.sql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await connection.query(statement);
      }
      await connection.execute(
        `INSERT INTO ${historyTable} (name, checksum) VALUES (?, ?)`,
        [migration.name, migration.checksum],
      );
      console.log(`Applied ${migration.name}`);
    }
  } finally {
    connection.release();
  }
}

export async function withDatabaseConnection(action) {
  const connection = await pool.getConnection();
  try {
    return await action(connection);
  } finally {
    connection.release();
  }
}

export async function closeDatabasePool() {
  await pool.end();
}
