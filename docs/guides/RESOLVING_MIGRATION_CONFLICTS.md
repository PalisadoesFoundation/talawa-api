# Resolving Drizzle Migration Conflicts

When working with Drizzle migrations, you might encounter conflicts when multiple branches introduce schema changes simultaneously. This guide explains how to resolve them.

## 1. Identify the Conflict
Conflicts usually appear in:
- `drizzle_migrations/meta/_journal.json`: The registry of applied migrations.
- `drizzle_migrations/`: Overlapping timestamps or snapshot differences.

## 2. Linearize History
Drizzle requires a strictly linear migration history.

### Option A: Re-generate Locally (Recommended)
If your local migration conflicts with main:
1.  **Discard your local migration files** (the `.sql` file you generated).
2.  **Pull latest changes** from `main` or `upstream`.
3.  **Run generation again**:
    ```bash
    pnpm generate_drizzle_migrations
    ```
    This creates a new migration on top of the latest HEAD.

### Option B: Manual Journal Fix (Advanced)
If `_journal.json` has conflicts:
1.  Open `drizzle_migrations/meta/_journal.json`.
2.  Ensure the entries are sorted chronologically.
3.  Ensure the `idx` (index) values are sequential (0, 1, 2, ...).

## 3. Verify
Run checks to ensure the schema is consistent:
```bash
pnpm check_drizzle_migrations
```

## 4. Troubleshooting "Collision" Errors
If you see an error like "snapshot collision":
1.  Delete your local `drizzle/meta` folder snapshot files (not the journal yet).
2.  Delete your conflicting `.sql` migration file.
3.  Run `pnpm generate_drizzle_migrations` freshly.
