import {
  closeDatabasePool,
  getMigrationStatus,
  withDatabaseConnection,
} from '../migrationRunner.js';

const requiredTables = [
  'users',
  'rider_profiles',
  'associations',
  'association_memberships',
  'rider_documents',
  'trips',
  'trip_status_history',
  'association_contributions',
  'schema_migrations',
];

const requiredForeignKeys = [
  'rider_profiles.user_id->users.id',
  'associations.manager_user_id->users.id',
  'association_memberships.association_id->associations.id',
  'association_memberships.rider_user_id->rider_profiles.user_id',
  'rider_documents.rider_user_id->rider_profiles.user_id',
  'rider_documents.reviewed_by_user_id->users.id',
  'trips.client_user_id->users.id',
  'trips.rider_user_id->rider_profiles.user_id',
  'trip_status_history.trip_id->trips.id',
  'trip_status_history.actor_user_id->users.id',
  'association_contributions.membership_id->association_memberships.id',
  'association_contributions.received_by_user_id->users.id',
];

const requiredChecks = [
  'ck_users_login_identifier',
  'ck_rider_profiles_verified_availability',
  'ck_membership_dates',
  'ck_trips_distinct_parties',
  'ck_trips_price',
  'ck_trips_pickup_coordinates',
  'ck_trips_dropoff_coordinates',
  'ck_trips_agreed_before_acceptance',
  'ck_trip_history_status_change',
  'ck_contributions_amount',
  'ck_contributions_period',
  'ck_contributions_paid_fields',
];

const requiredColumns = {
  users: ['id', 'role', 'account_status', 'first_name', 'last_name', 'email', 'phone', 'password_hash', 'created_at', 'updated_at'],
  rider_profiles: ['user_id', 'verification_status', 'availability_status', 'created_at', 'updated_at'],
  associations: ['id', 'manager_user_id', 'name', 'locality', 'country_code', 'created_at', 'updated_at'],
  association_memberships: ['id', 'association_id', 'rider_user_id', 'membership_status', 'created_at', 'updated_at'],
  rider_documents: ['id', 'rider_user_id', 'document_type', 'private_storage_key', 'verification_status', 'created_at', 'updated_at'],
  trips: ['id', 'client_user_id', 'rider_user_id', 'status', 'pickup_description', 'dropoff_description', 'agreed_price', 'currency_code', 'created_at', 'updated_at'],
  trip_status_history: ['id', 'trip_id', 'previous_status', 'new_status', 'actor_user_id', 'created_at'],
  association_contributions: ['id', 'membership_id', 'amount', 'currency_code', 'contribution_status', 'created_at', 'updated_at'],
  schema_migrations: ['name', 'checksum', 'applied_at'],
};

try {
  await withDatabaseConnection(async (connection) => {
    const migrationStatuses = await getMigrationStatus(connection);
    const pendingMigrations = migrationStatuses.filter((migration) => migration.status !== 'applied');
    const [tables] = await connection.execute(
      `SELECT table_name, engine, table_collation FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`,
    );
    const tableMap = new Map(tables.map((table) => [table.table_name, table]));
    const missingTables = requiredTables.filter((name) => !tableMap.has(name));
    const incorrectlyConfiguredTables = requiredTables.filter((name) => {
      const table = tableMap.get(name);
      return table && (table.engine !== 'InnoDB' || !table.table_collation?.startsWith('utf8mb4_'));
    });

    const [columns] = await connection.execute(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = DATABASE()`,
    );
    const columnsByTable = new Map();
    for (const column of columns) {
      if (!columnsByTable.has(column.table_name)) columnsByTable.set(column.table_name, new Set());
      columnsByTable.get(column.table_name).add(column.column_name);
    }
    const missingColumns = Object.entries(requiredColumns).flatMap(([table, names]) =>
      names.filter((name) => !columnsByTable.get(table)?.has(name)).map((name) => `${table}.${name}`),
    );

    const [foreignKeys] = await connection.execute(
      `SELECT table_name, column_name, referenced_table_name, referenced_column_name
       FROM information_schema.key_column_usage
       WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL`,
    );
    const actualForeignKeys = new Set(foreignKeys.map((key) =>
      `${key.table_name}.${key.column_name}->${key.referenced_table_name}.${key.referenced_column_name}`,
    ));
    const missingForeignKeys = requiredForeignKeys.filter((key) => !actualForeignKeys.has(key));

    const [checks] = await connection.execute(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE constraint_schema = DATABASE() AND constraint_type = 'CHECK'`,
    );
    const actualChecks = new Set(checks.map((check) => check.constraint_name));
    const missingChecks = requiredChecks.filter((name) => !actualChecks.has(name));

    const errors = [
      ...pendingMigrations.map((migration) => `migration ${migration.name} is pending`),
      ...missingTables.map((name) => `missing table ${name}`),
      ...missingColumns.map((name) => `missing column ${name}`),
      ...incorrectlyConfiguredTables.map((name) => `table ${name} must use InnoDB and utf8mb4`),
      ...missingForeignKeys.map((name) => `missing foreign key ${name}`),
      ...missingChecks.map((name) => `missing check constraint ${name}`),
    ];

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    console.log(`Schema verified: ${requiredTables.length} tables, ${requiredForeignKeys.length} foreign keys, ${requiredChecks.length} check constraints, and all migrations applied.`);
  });
} catch (error) {
  console.error('Schema verification failed. Check the MySQL connection and applied migrations.');
  const connectionErrorCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'EPERM',
    'ER_ACCESS_DENIED_ERROR',
  ]);
  if (error.message && !connectionErrorCodes.has(error.code)) {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
