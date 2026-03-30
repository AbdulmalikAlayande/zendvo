import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

interface MigrationJournal {
  version: string;
  dialect: string;
  entries: Array<{
    idx: number;
    version: string;
    when: number;
    tag: string;
    breakpoints: boolean;
  }>;
}

/**
 * Checks if database migrations are in sync with local migration files
 * @returns Promise<{ inSync: boolean; message: string }>
 */
export async function checkMigrationStatus(): Promise<{
  inSync: boolean;
  message: string;
  localMigrations: number;
  appliedMigrations: number;
}> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/zendvo";

  let pool: Pool | null = null;

  try {
    // Read local migration journal
    const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
    const journalContent = readFileSync(journalPath, "utf-8");
    const journal: MigrationJournal = JSON.parse(journalContent);
    const localMigrationCount = journal.entries.length;

    // Connect to database
    pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);

    // Check if migrations table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      );
    `);

    const migrationsTableExists = tableCheckResult.rows[0].exists;

    if (!migrationsTableExists) {
      return {
        inSync: false,
        message: `⚠️  Migration table does not exist. Database needs initialization. Expected ${localMigrationCount} migration(s).`,
        localMigrations: localMigrationCount,
        appliedMigrations: 0,
      };
    }

    // Query applied migrations
    const appliedMigrationsResult = await pool.query(`
      SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations;
    `);

    const appliedMigrationCount = parseInt(
      appliedMigrationsResult.rows[0].count,
      10
    );

    if (appliedMigrationCount < localMigrationCount) {
      return {
        inSync: false,
        message: `⚠️  Database schema is OUT OF SYNC! Applied: ${appliedMigrationCount}, Local: ${localMigrationCount}. Run migrations before starting.`,
        localMigrations: localMigrationCount,
        appliedMigrations: appliedMigrationCount,
      };
    }

    if (appliedMigrationCount > localMigrationCount) {
      return {
        inSync: false,
        message: `⚠️  Database has MORE migrations than local files! Applied: ${appliedMigrationCount}, Local: ${localMigrationCount}. Pull latest code.`,
        localMigrations: localMigrationCount,
        appliedMigrations: appliedMigrationCount,
      };
    }

    return {
      inSync: true,
      message: `✅ Database schema is in sync. ${appliedMigrationCount} migration(s) applied.`,
      localMigrations: localMigrationCount,
      appliedMigrations: appliedMigrationCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      inSync: false,
      message: `❌ Migration check failed: ${errorMessage}`,
      localMigrations: 0,
      appliedMigrations: 0,
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Runs database migrations
 */
export async function runMigrations(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/zendvo";

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}
