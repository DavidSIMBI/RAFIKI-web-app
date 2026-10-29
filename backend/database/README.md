# RAFIKI database

The initial MySQL 8 schema is in `migrations/202610290001_initial_schema.sql`. All tables use InnoDB and `utf8mb4`; timestamps are stored as UTC `DATETIME(3)` values. The backend pool and migration runner set each MySQL session timezone to `+00:00`.

## Tables and relationships

- `users` stores login identifiers, password hashes, account status and one role: `client`, `rider`, `association_manager` or `admin`.
- `rider_profiles` extends a rider account. A database check prevents the `available` state unless verification is `verified`.
- `associations` identifies an association and its manager and locality. Locality, territory and province are ordinary fields so Nyankunde and later Marabo can be represented without a schema change.
- `association_memberships` links a rider profile to an association.
- `rider_documents` stores document metadata and an opaque private storage key only; file bytes are not stored here. The key must be kept out of client facing API responses and point to private storage.
- `trips` links a client to an optional assigned rider and stores route descriptions, optional coordinate pairs, status and agreed price/currency. A payment for a trip is a direct cash arrangement between client and rider; RAFIKI does not collect or record it.
- `trip_status_history` is append only by design and retains status transitions and their actor. The application must write a trip update and its history row in one transaction.
- `association_contributions` tracks association dues against a membership, separately from any trip price.
- `schema_migrations` records applied migration filenames and SHA-256 checksums.

All foreign keys use `ON DELETE RESTRICT`; historical trips, status changes and verification records cannot be erased by deleting a parent row. User role authorization and the rule that only a currently verified rider can accept a trip must also be checked by future application services; those flows are not implemented in this stage.

No user, rider, association, trip, document or payment data is seeded.

## Database setup (macOS, existing MySQL installation)

MySQL client 8 is installed on the development machine, but no server answered through the default socket or TCP port during setup. Start the already installed MySQL Server from its MySQL preference pane, or, if this installer script exists, run:

```sh
sudo /usr/local/mysql/support-files/mysql.server start
```

Then create a dedicated empty development database and a local application account. Choose a local password yourself and enter the same value in `backend/.env`; do not commit `.env`.

```sql
CREATE DATABASE rafiki_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'rafiki_app'@'127.0.0.1' IDENTIFIED BY 'replace-with-a-local-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON rafiki_dev.* TO 'rafiki_app'@'127.0.0.1';
```

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASSWORD` in the existing `backend/.env`. `.env.example` is a template and contains no credential. Use a dedicated database whose name ends in `_dev`; the migration command refuses other environments and refuses to initialize an untracked database that already contains tables.

## Migration commands

From `backend/`:

```sh
npm run db:status
npm run db:migrate
npm run db:verify
```

`db:status` reads applied files and checks checksums. `db:migrate` applies pending SQL files in filename order and stores a SHA-256 checksum after each migration. Applied files must not be edited; add a new numbered migration instead. The initial DDL is idempotent for safe retry after a partial MySQL DDL run, since MySQL DDL statements commit independently. The runner never drops or truncates application data.

`db:verify` checks required tables, InnoDB/utf8mb4 settings, foreign keys and check constraints. No migration is run automatically at server startup.
