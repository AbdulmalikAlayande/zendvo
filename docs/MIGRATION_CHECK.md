# Database Migration Check on Startup

## Overview
The application now automatically checks database migration status on server startup, ensuring schema alignment before handling requests.

## How It Works

### Startup Check
When the Next.js server starts, `src/instrumentation.ts` runs automatically and:
1. Reads local migration files from `drizzle/meta/_journal.json`
2. Connects to the database and checks applied migrations
3. Compares counts and logs the status

### Status Messages

✅ **In Sync**: Database matches local migrations
```
✅ Database schema is in sync. 1 migration(s) applied.
```

⚠️ **Out of Sync**: Local has more migrations
```
⚠️ Database schema is OUT OF SYNC! Applied: 0, Local: 1. Run migrations before starting.
```

⚠️ **Ahead**: Database has more migrations than local
```
⚠️ Database has MORE migrations than local files! Applied: 2, Local: 1. Pull latest code.
```

## Configuration

### Strict Mode (Production)
Set environment variable to halt startup if migrations are out of sync:
```bash
STRICT_MIGRATION_CHECK=true
```

Without this, the server will start with a warning but continue running.

## Available Commands

```bash
# Check migration status manually
npm run db:check

# Apply pending migrations
npm run db:migrate

# Push schema changes to database
npm run db:push
```

## Files Modified
- `src/instrumentation.ts` - Next.js startup hook
- `src/lib/db/migration-checker.ts` - Migration verification logic
- `src/lib/db/index.ts` - Exports migration utilities
- `next.config.ts` - Enabled instrumentation hook
- `package.json` - Added migration scripts

## Testing
Start your server and check the console output:
```bash
npm run dev
```

You should see:
```
🔍 Checking database migration status...
✅ Database schema is in sync. 1 migration(s) applied.
```
